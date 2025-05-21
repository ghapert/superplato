from fastapi import APIRouter, Request, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from database import get_db
from utils.plato_login import get_plato_session
from utils.schedule_checker import is_currently_in_lecture
from services.lecture_service import find_current_lecture, show_user_lectures
from services.auth_dependency import get_current_user, verify_pro_user
from services.attendance_service import get_attendance_summary_for_user
import logging
from playwright.async_api import async_playwright
from models.attendance import Attendance
from models.lecture import Lecture
import requests
from bs4 import BeautifulSoup
import random
import os
from utils.auth_helper import decrypt
from models.user import User
from fastapi.responses import FileResponse
from sqlalchemy import update, and_
from models.user_lecture_map import user_lecture
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone
from utils.attendance_summary import make_attendance_prompt
from services.ai_service import get_gpt_attendance_analysis

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

# ------------------------------
# 공통 유틸 함수들
# ------------------------------

async def extract_requests_session_from_context(context):
    """Playwright context에서 쿠키를 추출해 requests.Session으로 옮겨주는 함수."""
    session = requests.Session()
    cookies = await context.cookies()
    for cookie in cookies:
        session.cookies.set(cookie['name'], cookie['value'], domain=cookie.get("domain"))
    return session

async def get_form_data(session, course_id):
    """autoattendance.php에서 필요한 form_data를 파싱해 반환한다."""
    url = f"https://plato.pusan.ac.kr/local/ubattendance/autoattendance.php?id={course_id}"
    res = session.get(url)
    soup = BeautifulSoup(res.text, "html.parser")
    return {
        "type": soup.find("input", {"name": "type"})["value"],
        "id": soup.find("input", {"name": "id"})["value"],
        "autoid": soup.find("input", {"name": "autoid"})["value"],
        "sesskey": soup.find("input", {"name": "sesskey"})["value"]
    }

def get_today_utc_range():
    """
    [수정] UTC 기준 오늘(0시~24시) 범위를 반환
    """
    now_utc = datetime.now(timezone.utc)
    start_utc = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    end_utc = start_utc + timedelta(days=1)
    return start_utc, end_utc

def already_attended_today(db, user_id, lecture_id):
    """
    KST 기준으로 오늘(0시~24시) 범위 안에 이미 출석 기록이 있는지 확인
    """
    KST = timezone(timedelta(hours=9))
    now_kst = datetime.now(KST)
    start_of_day_kst = now_kst.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day_kst = start_of_day_kst + timedelta(days=1)
    start_of_day_utc = start_of_day_kst.astimezone(timezone.utc)
    end_of_day_utc = end_of_day_kst.astimezone(timezone.utc)
    attendance = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.lecture_id == lecture_id,
        Attendance.timestamp >= start_of_day_utc,
        Attendance.timestamp < end_of_day_utc
    ).first()
    return attendance

# ------------------------------
# 수동 인증코드 입력 출석
# ------------------------------

@router.post("/auto_attend")
async def auto_attend(
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 시간에 '수동 인증코드'를 입력해 출석하는 라우트.
    """
    user = current_user
    data = await request.json()
    auth_code = data.get('auth_code')

    lecture = find_current_lecture(user)
    if not lecture:
        return {"status": "error", "message": "현재 수업 시간이 아닙니다."}

    # KST 기준 출석 여부 확인
    already_attended = already_attended_today(db, user.id, lecture.id)
    if already_attended:
        logging.warning(f"[이미 오늘 출석 처리됨] user_id={user.id}, lecture_id={lecture.id}")
        return {"status": "error", "message": "이미 오늘 출석한 강의입니다."}

    try:
        async with async_playwright() as p:
            browser, page = await get_plato_session(p, user)
            attendance_url = f"https://plato.pusan.ac.kr/local/ubattendance/my_status.php?id={lecture.plato_course_id}"
            await page.goto(attendance_url)
            await page.wait_for_load_state("networkidle")

            # 'autoattendance.php'가 아니라면 현재 출석 중이 아님
            if "autoattendance.php" not in page.url:
                await browser.close()
                return {"status": "error", "message": "현재 출석 중이 아닙니다."}

            # 수동 인증코드 입력
            await page.fill('input[name="authkey"]', auth_code)
            await page.click('input[type="submit"]')
            await page.wait_for_load_state("networkidle")

            final_url = page.url
            if "user_action.php" in final_url:
                # 인증 실패
                await browser.close()
                return {"status": "error", "message": "인증코드가 잘못되었거나 출석 실패"}
            elif "my_status.php" in final_url:
                # 출석 성공 → DB 저장
                # [수정] 다시 한 번 KST 기준 중복 체크
                already = already_attended_today(db, user.id, lecture.id)
                if already:
                    await browser.close()
                    logging.warning(f"[⚠️ 이미 출석 처리됨(경합)] user_id={user.id}, lecture_id={lecture.id}")
                    return {"status": "error", "message": "이미 출석한 강의입니다."}
                try:
                    db.add(Attendance(
                        user_id=user.id,
                        lecture_id=lecture.id,
                        # [참고] 모델에서 timestamp 는 UTC default
                        type=0,  # 자동 출석(0)
                        auth_code=auth_code
                    ))
                    try:
                        db.commit()
                        await browser.close()
                        logging.info(f"[✅ 출석 성공] user_id={user.id}, lecture_id={lecture.id}")
                        return {"status": "success", "message": "출석 인증 완료!"}
                    except IntegrityError as ie:
                        db.rollback()
                        await browser.close()
                        logging.warning(f"[❌ 출석 INSERT IntegrityError] user_id={user.id}, lecture_id={lecture.id}, error={str(ie)}")
                        return {"status": "error", "message": "이미 출석한 강의이거나 DB 오류가 발생했습니다."}
                except Exception as e:
                    db.rollback()
                    await browser.close()
                    logging.error(f"[❌ 출석 INSERT 실패] user_id={user.id}, lecture_id={lecture.id}, error={str(e)}")
                    return {"status": "error", "message": "이미 출석한 강의이거나 DB 오류가 발생했습니다."}
            else:
                await browser.close()
                return {"status": "error", "message": "출석 실패: 알 수 없는 리다이렉트 경로"}
    except Exception as e:
        db.rollback()
        logging.error(f"출석 오류: user_id={user.id}, error={str(e)}")
        return {"status": "error", "message": str(e)}

# ------------------------------
# 출석 로그 조회 / 상태 확인
# ------------------------------

@router.get("/logs")
async def get_attendance_logs(
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    사용자의 출석 로그(내림차순).
    """
    user = current_user
    logs = db.query(Attendance).filter_by(user_id=user.id).order_by(Attendance.timestamp.desc()).all()

    # 강의 id → 강의명 매핑을 위해 미리 조회
    lecture_ids = {log.lecture_id for log in logs}
    lectures = {l.id: l for l in db.query(Lecture).filter(Lecture.id.in_(lecture_ids)).all()}

    result = []
    for log in logs:
        lec = lectures.get(log.lecture_id)
        result.append({
            "attendance_id": log.id,
            "lecture_id": log.lecture_id,
            "lecture_name": lec.name if lec else None,
            "timestamp": log.timestamp.isoformat(),
            "type": log.type,
            "auth_code": log.auth_code
        })
    return {
        "status": "success",
        "count": len(result),
        "attendances": result
    }

@router.get("/status")
async def check_attendance_status(
    request: Request,
    current_user=Depends(get_current_user)
):
    """
    현재 시간이 수업 시간인지, 어떤 강의인지 확인 (이 부분은 여전히 KST 로직 사용 가능).
    """
    lecture = find_current_lecture(current_user)
    if lecture:
        return {
            "can_attend": True,
            "lecture_name": lecture.name,
            "message": f"현재 {lecture.name} 수업 시간입니다."
        }
    else:
        return {
            "can_attend": False,
            "message": "현재 수업 시간이 아닙니다."
        }

@router.get("/view/{course_id}")
async def get_attendance_summary(
    course_id: int,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    해당 course_id(플라토 강의아이디)에 대한 사용자의 출석 요약 + (Pro 유저 한정) GPT 분석.
    """
    try:
        user = current_user
        result = await get_attendance_summary_for_user(user, course_id)
        lecture = db.query(Lecture).filter_by(plato_course_id=course_id).first()
        lecture_name = lecture.name if lecture else "알 수 없음"

        gpt_summary = "이 기능은 SuperPlato Pro 사용자만 이용할 수 있습니다."

        # Pro 유저일 경우에만 GPT 호출
        if getattr(user, "is_pro", False):
            gpt_prompt = make_attendance_prompt(result["records"], lecture_name)
            gpt_summary = await get_gpt_attendance_analysis(result["records"], lecture_name)

            # 로그도 Pro일 때만 남김
            logging.info(f"[GPT_ATTENDANCE_PROMPT] user_id={user.id}, lecture={lecture_name}\n{gpt_prompt}")
            logging.info(f"[GPT_ATTENDANCE_SUMMARY] user_id={user.id}, lecture={lecture_name}\n{gpt_summary}")

        return {
            "status": "success",
            "data": {
                **result,
                "lecture_name": lecture_name,
                "gpt_summary": gpt_summary
            }
        }

    except Exception as e:
        logging.error(f"[출석 요약 실패] user_id={getattr(current_user, 'id', 'UNKNOWN')}, error={str(e)}")
        return {"status": "error", "message": str(e)}
    
# ------------------------------
# 수동 브루트포스 출석
# ------------------------------

@router.post("/bruteforce_attend")
async def bruteforce_attend(
    request: Request,
    current_user=Depends(verify_pro_user),
    db: Session = Depends(get_db)
):
    """
    현재 강의가 출석 중이면 000~999 인증코드를 requests 기반으로 브루트포스 시도(수동 트리거).
    
    + attendance_in_progress 체크/설정 로직 추가
    """
    from sqlalchemy import update
    user = current_user
    lecture = find_current_lecture(user)
    if not lecture:
        return {"status": "error", "message": "현재 수업 시간이 아닙니다."}

    # 1) 이미 오늘 출석했는지 (KST) 체크
    already_attended = already_attended_today(db, user.id, lecture.id)
    if already_attended:
        logging.warning(f"[이미 오늘 출석 처리됨] user_id={user.id}, lecture_id={lecture.id}")
        return {"status": "error", "message": "이미 오늘 출석한 강의입니다."}

    # 2) user_lecture에서 현재 in_progress 확인
    row = db.execute(
        user_lecture.select()
        .where(
            (user_lecture.c.user_id == user.id)
            & (user_lecture.c.lecture_id == lecture.id)
        )
    ).fetchone()

    if not row:
        return {"status": "error", "message": "수강 정보가 없습니다. (user_lecture 관계 없음)"}

    # 만약 in_progress=True 면 중복 시도 막기
    if getattr(row, "attendance_in_progress", False):
        logging.warning(
            f"[bruteforce_attend] 이미 다른 브루트포스가 진행 중 user_id={user.id}, lecture_id={lecture.id}"
        )
        return {
            "status": "error",
            "message": "이미 브루트포스 출석이 진행 중입니다."
        }

    # in_progress=False -> True 로 셋
    stmt = (
        update(user_lecture)
        .where(
            (user_lecture.c.user_id == user.id)
            & (user_lecture.c.lecture_id == lecture.id)
        )
        .values(attendance_in_progress=True)
    )
    db.execute(stmt)
    db.commit()

    try:
        # ===== (원래 브루트포스 로직) =====
        async with async_playwright() as p:
            browser, page = await get_plato_session(p, user)
            attendance_url = f"https://plato.pusan.ac.kr/local/ubattendance/my_status.php?id={lecture.plato_course_id}"
            await page.goto(attendance_url)
            await page.wait_for_load_state("networkidle")

            if "autoattendance.php" not in page.url:
                await browser.close()
                return {"status": "error", "message": "현재 출석 중이 아닙니다."}

            context = page.context
            session = await extract_requests_session_from_context(context)
            await browser.close()

            codes = list(range(1000))
            random.shuffle(codes)
            headers = {
                "Referer": f"https://plato.pusan.ac.kr/local/ubattendance/autoattendance.php?id={lecture.plato_course_id}"
            }

            for code in codes:
                try:
                    form_data = await get_form_data(session, lecture.plato_course_id)
                    form_data["authkey"] = f"{code:03d}"

                    res = session.post(
                        "https://plato.pusan.ac.kr/local/ubattendance/user_action.php",
                        data=form_data,
                        headers=headers,
                        allow_redirects=True
                    )

                    if "my_status.php" in res.url:
                        logging.info(f"[인증코드 추측 성공] code={code:03d}")

                        # 다시 한 번 오늘 출석 중복 체크 (경합 방지, KST 기준)
                        already = already_attended_today(db, user.id, lecture.id)
                        if already:
                            logging.warning(
                                f"[이미 오늘 출석 처리됨(경합)] user_id={user.id}, lecture_id={lecture.id}"
                            )
                            return {
                                "status": "error",
                                "message": "이미 오늘 출석한 강의입니다 (경합)."
                            }

                        new_attendance = Attendance(
                            user_id=user.id,
                            lecture_id=lecture.id,
                            type=1,  # 수동 브루트포스
                            auth_code=code
                        )
                        db.add(new_attendance)

                        try:
                            db.commit()
                            logging.info(
                                f"[DB INSERT 성공] user_id={user.id}, lecture_id={lecture.id}, code={code:03d}"
                            )
                            return {
                                "status": "success",
                                "message": f"브루트포스 출석 성공! 코드: {code:03d}"
                            }

                        except IntegrityError as ie:
                            db.rollback()
                            logging.warning(
                                f"[DB INSERT 충돌] code={code:03d}, error={str(ie)}"
                            )
                            return {
                                "status": "error",
                                "message": f"이미 출석한 강의(중복) - code={code:03d}"
                            }

                        except Exception as e:
                            db.rollback()
                            logging.error(
                                f"[DB INSERT 에러] code={code:03d}, error={str(e)}"
                            )
                            return {
                                "status": "error",
                                "message": "DB 삽입 오류가 발생했습니다."
                            }

                except Exception as e:
                    db.rollback()
                    logging.warning(f"[브루트포스 시도 실패] code={code:03d}, error={str(e)}")

            # 모든 코드 실패
            return {
                "status": "error",
                "message": "브루트포스 출석 실패: 모든 코드 시도 실패"
            }

    except Exception as e:
        logging.error(f"[requests 브루트포스 출석 오류] user_id={user.id}, error={str(e)}")
        db.rollback()
        return {
            "status": "error",
            "message": str(e)
        }

    finally:
        # 3) in_progress=False 로 해제
        stmt_off = (
            update(user_lecture)
            .where(
                (user_lecture.c.user_id == user.id)
                & (user_lecture.c.lecture_id == lecture.id)
            )
            .values(attendance_in_progress=False)
        )
        db.execute(stmt_off)
        db.commit()

@router.get("/brute_attend_options")
async def get_brute_attend_options(current_user=Depends(get_current_user)):
    """
    사용자가 브루트포스 출석 대상으로 선택할 수 있는 강의 목록(시간표) 반환.
    """
    WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"]
    enrolled_lectures = show_user_lectures(current_user)
    lecture_data = []

    for lec in enrolled_lectures:
        schedules = []
        for sched in lec.schedules:
            loc = sched.location_details
            location_details = None
            if loc:
                location_details = {
                    "building_name": loc.building_name,
                    "building_code": loc.building_code,
                    "room_number": loc.room_number,
                }
            schedules.append({
                'weekday': WEEKDAYS[sched.weekday],
                'start': sched.start_time.strftime("%H:%M"),
                'end': sched.end_time.strftime("%H:%M"),
                'location': sched.location,
                'location_details': location_details,
            })
        lecture_data.append({
            "lecture_id": lec.id,
            "plato_course_id": lec.plato_course_id,
            "name": lec.name,
            "code": lec.code,
            "section": lec.section,
            "schedules": schedules
        })

    return {
        "status": "success",
        "lectures": lecture_data
    }

@router.post("/report_attendance_success")
async def report_attendance_success(request: Request, db: Session = Depends(get_db)):
    """
    runner에서 출석 성공 시 호출되는 API. (필요시 자동 출석이 성공했을 때 호출하도록)
    """
    data = await request.json()
    user_id = data.get("user_id")
    course_id = data.get("course_id")
    auth_code = data.get("auth_code", None)

    if not course_id:
        return {"status": "error", "message": "course_id는 필수입니다."}
    if not user_id:
        return {"status": "error", "message": "user_id가 필요합니다."}

    user = db.query(User).filter_by(id=user_id).first()
    lecture = db.query(Lecture).filter_by(plato_course_id=course_id).first()
    if not user or not lecture:
        return {"status": "error", "message": "유효하지 않은 사용자 또는 강의입니다."}

    db.add(Attendance(
        user_id=user.id,
        lecture_id=lecture.id,
        type=2,  # 자동 브루트포스 출석
        auth_code=auth_code
    ))
    db.commit()
    return {"status": "success", "message": "출석 기록이 저장되었습니다."}

# ------------------------------
# 자동 출석 ON/OFF (DB 기반) - 수정된 부분
# ------------------------------
@router.post("/set_auto_attendance")
async def set_auto_attendance(
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(verify_pro_user)
):
    """
    사용자가 자동 출석할 강의를 선택하면 해당 강의만 자동 출석이 켜지고, 나머지는 꺼집니다.
    """
    data = await request.json()
    new_lecture_ids = data.get("lecture_ids", [])
    logging.info(f"[set_auto_attendance] user_id={current_user.id} new_lecture_ids={new_lecture_ids}")

    if not isinstance(new_lecture_ids, list):
        logging.warning(f"[set_auto_attendance] user_id={current_user.id} lecture_ids 타입 오류: {type(new_lecture_ids)}")
        return {"status": "error", "message": "강의 목록이 올바르지 않습니다."}

    # 1) 모든 강의 자동 출석 OFF
    stmt_off = (
        update(user_lecture)
        .where(user_lecture.c.user_id == current_user.id)
        .values(auto_attendance_enabled=False)
    )
    db.execute(stmt_off)
    logging.info(f"[set_auto_attendance] user_id={current_user.id} 모든 강의 OFF 처리")

    # 2) 선택한 강의만 자동 출석 ON
    if new_lecture_ids:
        stmt_on = (
            update(user_lecture)
            .where(
                and_(
                    user_lecture.c.user_id == current_user.id,
                    user_lecture.c.lecture_id.in_(new_lecture_ids)
                )
            )
            .values(auto_attendance_enabled=True)
        )
        db.execute(stmt_on)
        logging.info(f"[set_auto_attendance] user_id={current_user.id} ON lecture_ids={new_lecture_ids}")

    db.commit()
    logging.info(f"[set_auto_attendance] user_id={current_user.id} 커밋 완료")
    return {
        "status": "success",
        "message": "자동 출석 강의가 정상적으로 저장되었습니다."
    }

@router.get("/auto_attendance_targets")
async def get_auto_attendance_targets(
    current_user=Depends(verify_pro_user),
    db: Session = Depends(get_db)
):
    """
    현재 로그인한 사용자의 자동 출석 '활성화된' 강의 목록 반환.
    """
    from models.lecture import Lecture

    lecture_ids = [
        row.lecture_id
        for row in db.execute(
            user_lecture.select().where(
                (user_lecture.c.user_id == current_user.id) &
                (user_lecture.c.auto_attendance_enabled == True)
            )
        )
    ]
    lectures = db.query(Lecture).filter(Lecture.id.in_(lecture_ids)).all()

    WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"]
    result = []
    for lec in lectures:
        schedules = []
        for sched in lec.schedules:
            weekday_label = WEEKDAYS[sched.weekday] if 0 <= sched.weekday < 7 else str(sched.weekday)
            schedules.append({
                "weekday": weekday_label,
                "start": sched.start_time.strftime("%H:%M"),
                "end": sched.end_time.strftime("%H:%M"),
                "location": getattr(sched, "location", None)
            })
        result.append({
            "lecture_id": lec.id,
            "plato_course_id": lec.plato_course_id,
            "lecture_name": lec.name,
            "code": lec.code,
            "section": lec.section,
            "schedules": schedules
        })

    return {
        "status": "success",
        "lectures": result
    }

@router.get("/current_auto_attend_courses")
async def current_auto_attend_courses(
    current_user=Depends(verify_pro_user),
    db: Session = Depends(get_db)
):
    """
    현재 로그인한 사용자의 자동 출석 대상 강의 목록 및 상태 반환
    """
    from models.lecture import Lecture

    lecture_ids = [
        row.lecture_id
        for row in db.execute(
            user_lecture.select().where(
                (user_lecture.c.user_id == current_user.id) &
                (user_lecture.c.auto_attendance_enabled == True)
            )
        )
    ]
    lectures = db.query(Lecture).filter(Lecture.id.in_(lecture_ids)).all()

    if not lectures:
        return {
            "status": "success",
            "courses": [],
            "runner_pid": None,
            "message": "자동 출석이 설정된 강의가 없습니다. 아래 버튼으로 자동 출석을 등록해보세요!"
        }

    course_names = [lec.name for lec in lectures if lec.name]
    msg = f"자동 출석이 활성화된 강의가 {len(course_names)}개 있습니다."
    if course_names:
        msg += " (" + ", ".join(course_names) + ")"

    return {
        "status": "success",
        "courses": [
            {
                "lecture_id": lec.id,
                "lecture_name": lec.name,
                "code": lec.code,
                "section": lec.section,
            }
            for lec in lectures
        ],
        "runner_pid": None,
        "message": msg
    }

@router.get("/my_lectures")
async def get_my_lectures(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 로그인한 사용자의 전체 수강 강의 목록(자동 출석 여부 무관).
    """
    from models.lecture import Lecture
    lectures = db.query(Lecture).join(user_lecture).filter(
        user_lecture.c.user_id == current_user.id
    ).all()

    WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"]
    result = []
    for lec in lectures:
        schedules = []
        for sched in lec.schedules:
            weekday_label = WEEKDAYS[sched.weekday] if 0 <= sched.weekday < 7 else str(sched.weekday)
            schedules.append({
                "weekday": weekday_label,
                "start": sched.start_time.strftime("%H:%M"),
                "end": sched.end_time.strftime("%H:%M"),
                "location": getattr(sched, "location", None)
            })
        result.append({
            "lecture_id": lec.id,
            "plato_course_id": lec.plato_course_id,
            "lecture_name": lec.name,
            "code": lec.code,
            "section": lec.section,
            "schedules": schedules
        })
    return {
        "status": "success",
        "lectures": result
    }

@router.get("/debug_user_lecture")
async def debug_user_lecture(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    디버그용: user_lecture 테이블에서 현재 유저의 설정 목록을 직접 확인.
    """
    rows = db.execute(
        user_lecture.select().where(user_lecture.c.user_id == current_user.id)
    ).fetchall()
    logging.info(f"[debug_user_lecture] user_id={current_user.id} rows={rows}")
    return [
        {
            "lecture_id": row.lecture_id,
            "auto_attendance_enabled": row.auto_attendance_enabled
        }
        for row in rows
    ]
