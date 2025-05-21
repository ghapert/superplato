import logging
import re
from datetime import time

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

from sqlalchemy.orm import Session
from fastapi import Depends
from database import get_db
from models.lecture import Lecture
from models.lecture_schedule import LectureSchedule

from utils.schedule_parser import parse_schedule

from utils.schedule_checker import is_currently_in_lecture
# 요일 변환 맵
WEEKDAY_MAP = {
    "월": 0,
    "화": 1,
    "수": 2,
    "목": 3,
    "금": 4,
    "토": 5,
    "일": 6
}

def save_schedule_to_db(course_code, section_number, schedule_data, db: Session):
    lecture = db.query(Lecture).filter_by(code=course_code, section=section_number).first()

    if not lecture:
        print(f"❌ 해당 강의 없음: {course_code}-{section_number}")
        return

    # 현재 이 강의의 기존 시간표 가져오기
    existing_schedules = db.query(LectureSchedule).filter_by(lecture_id=lecture.id).all()

    def is_duplicate(entry):
        weekday = WEEKDAY_MAP.get(entry["weekday"])
        if weekday is None:
            return True  # 잘못된 요일은 무시

        for sched in existing_schedules:
            if (
                sched.weekday == weekday and
                sched.start_time.strftime("%H:%M") == entry["start_time"] and
                sched.end_time.strftime("%H:%M") == entry["end_time"] and
                sched.location == entry["location"]
            ):
                return True
        return False

    for entry in schedule_data:
        weekday = WEEKDAY_MAP.get(entry["weekday"])
        if weekday is None:
            print(f"⚠️ 알 수 없는 요일: {entry['weekday']}")
            continue

        if not entry["start_time"] or not entry["end_time"] or not entry["duration"]:
            print(f"⚠️ 시간 정보가 불완전하여 건너뜀: {entry}")
            continue

        if is_duplicate(entry):
            print(f"⏩ 중복된 항목 건너뜀: {entry}")
            continue

        try:
            start_parts = [int(p) for p in entry["start_time"].split(":")]
            end_parts = [int(p) for p in entry["end_time"].split(":")]

            schedule = LectureSchedule(
                lecture_id=lecture.id,
                weekday=weekday,
                start_time=time(*start_parts),
                end_time=time(*end_parts),
                duration=entry["duration"],
                location=entry["location"],
            )
            db.add(schedule)
        except Exception as e:
            print(f"❌ 시간표 저장 중 오류 발생: {e}")

    print(f"[DEBUG] 총 저장 시도 완료: {len(schedule_data)}개")
    db.commit()
    print(f"✅ 시간표 저장 완료: {lecture.full_name}")



def parse_lecture_list(html):
    soup = BeautifulSoup(html, "html.parser")
    titles = soup.select("div.course-title")

    lectures = []
    for tag in titles:
        raw = tag.get_text(strip=True)
        match = re.match(r"(.+)\s+\(([\w\d]+)-(\d+)\)", raw)
        if match:
            name, code, section = match.groups()
            full_name = f"{name} ({code}-{section})"
            lectures.append({
                "name": name,
                "code": code,
                "section": section,
                "full_name": full_name
            })
        else:
            logging.warning(f"[⚠️ 정규식 불일치]: {raw}")
    return lectures

def store_parsed_lectures(lecture_dicts, db: Session):
    existing_lectures = {
        (lec.code, lec.section) for lec in db.query(Lecture).all()
    }

    for lec in lecture_dicts:
        key = (lec["code"], lec["section"])
        if key not in existing_lectures:
            new_lecture = Lecture(
                name=lec["name"],
                code=lec["code"],
                section=lec["section"],
                full_name=lec["full_name"]
            )
            db.add(new_lecture)
    db.commit()
    
    

def enroll_user_in_lectures(user, lecture_dicts, db: Session):
    all_lectures = {
        (lec.code, lec.section): lec for lec in db.query(Lecture).all()
    }
    user_lecture_keys = {(lec.code, lec.section) for lec in user.lectures}

    for lec in lecture_dicts:
        key = (lec["code"], lec["section"])
        if key not in user_lecture_keys:
            lecture = all_lectures.get(key)
            if lecture:
                user.lectures.append(lecture)
    db.commit()

def show_user_lectures(user):
    return user.lectures  # Lecture 객체 리스트 그대로 반환


def find_current_lecture(user):
    for lecture in user.lectures:
        for schedule in lecture.schedules:
            if is_currently_in_lecture(schedule):
                return lecture
    return None


async def get_schedule(course_code, section_number, subject_name, playwright=None):
    should_close = False

    if playwright is None:
        playwright = await async_playwright().start()
        should_close = True

    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context(accept_downloads=True)
    page = await context.new_page()

    try:
        await page.goto("https://onestop.pusan.ac.kr/page?menuCD=000000000000335")
        await page.wait_for_load_state("networkidle")

        # 🔍 검색 조건 입력
        await page.click('.select-pure__select')
        await page.click('.select-pure__option[data-value="0001"]')
        await page.click('input#SEARCH_GBN2')
        await page.fill('#SCH_SUBJ_NM', subject_name)
        await page.click('button:has-text("조회")')
        # ✅ 데이터 충분히 로드됐는지 확인
        try:
            await page.wait_for_function(
                "document.querySelectorAll('#resultTbody > tr').length >= 1", timeout=7000
            )
        except Exception as e:
            print(f"⚠️ wait_for_function 실패 → 강의 로드가 느릴 수 있음: {e}")
            await page.wait_for_timeout(2000)  # fallback으로 2초 대기

        # ✅ 강의명이 실제로 나타나는 것도 확인
        await page.wait_for_selector(f"text={subject_name}", timeout=5000)
        # ✅ 첫 페이지 내용 파싱
        html = await page.content()
        schedules = parse_schedule(html, course_code, section_number)
        previous_html = html

        page_count = 1
        max_pages = 20

        while not schedules:
            print(f"[🔄 {page_count} 페이지 탐색 중...]")
            await page.click("#resultTbody_Next")
            await page.wait_for_selector("#resultTbody > tr")
            html = await page.content()

            if html == previous_html:
                print("🚫 동일 페이지 반복 → 마지막 페이지로 판단, 탐색 중단.")
                break

            previous_html = html
            schedules = parse_schedule(html, course_code, section_number)

            page_count += 1
            if page_count > max_pages:
                print("⚠️ 페이지 탐색 최대 횟수 초과. 중단.")
                break

        return schedules

    finally:
        await browser.close()
        print("🧹 브라우저 정상 종료")
        if should_close:
            await playwright.stop()
            print("🧹 Playwright 세션 종료")
