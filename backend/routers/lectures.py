import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Lecture, LectureSchedule, LectureLocation, User
from services.auth_dependency import get_current_user
from services.lecture_service import (
    show_user_lectures,
    parse_lecture_list,
    store_parsed_lectures,
    enroll_user_in_lectures,
    get_schedule,
    save_schedule_to_db,
)
from utils.location_parser import parse_location
from utils.plato_login import get_plato_session
from utils.plato_popup_closer import popup_close
from urllib.parse import urlparse, parse_qs
from datetime import datetime
from playwright.async_api import async_playwright
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/lectures", tags=["lectures"])

WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

# ====== Pydantic 모델 정의 ======
class LectureLocationOut(BaseModel):
    building_name: Optional[str]
    building_code: Optional[str]
    room_number: Optional[str]
    class Config:
        orm_mode = True

class LectureScheduleOut(BaseModel):
    weekday: str
    start: str
    end: str
    location: Optional[str] = None
    location_details: Optional[LectureLocationOut] = None
    class Config:
        orm_mode = True

class LectureOut(BaseModel):
    id: int
    name: str
    code: str
    section: str
    plato_course_id: Optional[int]
    schedules: List[LectureScheduleOut]
    class Config:
        orm_mode = True

class MyLecturesResponse(BaseModel):
    status: str
    my_lectures: List[LectureOut]

@router.get("/all")
def get_all_lectures(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lectures = db.query(Lecture).all()
    data = []
    for lec in lectures:
        schedules = [{
            'weekday': WEEKDAYS[sched.weekday],
            'start': sched.start_time.strftime("%H:%M"),
            'end': sched.end_time.strftime("%H:%M")
        } for sched in lec.schedules]

        data.append({
            'id': lec.id,
            'name': lec.name,
            'code': lec.code,
            'section': lec.section,
            'student_count': len(lec.users),
            'plato_course_id': lec.plato_course_id,
            'schedules': schedules
        })

    return {"status": "success", "lectures": data}


@router.get("/my", response_model=MyLecturesResponse)
def get_my_lectures(current_user: User = Depends(get_current_user)):
    enrolled_lectures = show_user_lectures(current_user)
    data = []

    for lec in enrolled_lectures:
        schedules = []
        for sched in lec.schedules:
            # location_details가 있을 때만 dict로 변환
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

        data.append({
            'id': lec.id,
            'name': lec.name,
            'code': lec.code,
            'section': lec.section,
            'plato_course_id': lec.plato_course_id,
            'schedules': schedules
        })

    return MyLecturesResponse(status="success", my_lectures=data)


@router.post("/update")
async def update_lectures_and_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        async with async_playwright() as p:
            browser, page = await get_plato_session(p, current_user)
            context = page.context
            try:
                html = await page.content()
                lectures = parse_lecture_list(html)
                store_parsed_lectures(lectures, db)
                current_user.lectures.clear()
                db.commit()
                enroll_user_in_lectures(current_user, lectures, db)

                # Example of Firebase user update - after which browser context should be recreated
                # (Assuming somewhere here user.update_email or update_profile is called)
                # For demonstration, let's assume after enrollment we update Firebase user email:
                # await current_user.update_email(new_email)
                # After that, close and recreate context:
                # await context.close()
                # context = await browser.new_context()
                # page = await context.new_page()
                # If storage_state is used, save again here:
                # await context.storage_state(path="auth.json")

                for lec in lectures:
                    try:
                        schedule_data = await get_schedule(lec["code"], lec["section"], lec["name"], playwright=p)
                        save_schedule_to_db(lec["code"], lec["section"], schedule_data, db)
                        lec["schedule"] = schedule_data

                        await page.goto("https://plato.pusan.ac.kr")
                        await popup_close(page)
                        await page.wait_for_load_state("networkidle")
                        await page.locator('div.course-title', has_text=lec["name"]).click()
                        await page.wait_for_load_state("networkidle")
                        url = page.url
                        query = parse_qs(urlparse(url).query)
                        plato_id = query.get("id", [None])[0]

                        if plato_id:
                            db_lecture = db.query(Lecture).filter_by(code=lec["code"], section=lec["section"]).first()
                            if db_lecture:
                                db_lecture.plato_course_id = int(plato_id)
                                lec["plato_course_id"] = int(plato_id)
                                db.commit()

                        logging.info(f"[강의 처리 성공] {lec['full_name']}")
                    except Exception as e:
                        logging.warning(f"[강의 처리 실패] {lec['name']}: {e}")
                return {"status": "success", "message": "강의 및 시간표 업데이트 완료", "lectures": lectures}
            finally:
                await browser.close()
    except Exception as e:
        logging.error(f"[강의 업데이트 실패] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update_location")
def api_update_location(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logging.info(f"[update_location] 라우트 진입: user={current_user.id}")
    try:
        lectures = show_user_lectures(current_user)
        if not lectures:
            logging.info("[update_location] 등록된 강의 없음")
            return {"status": "empty", "message": "등록된 강의가 없습니다.", "my_lectures": []}

        for lecture in lectures:
            for schedule in lecture.schedules:
                location_str = schedule.location
                if location_str:
                    parsed = parse_location(location_str)
                    logging.debug(f"[update_location] location_str={location_str}, parsed={parsed}")
                    if parsed and parsed.get("type") == "offline":
                        building_code = parsed.get("building_code")
                        room = parsed.get("room")
                        building_name = parsed.get("building_name")

                        loc_obj = db.query(LectureLocation).filter_by(
                            building_code=building_code,
                            room_number=room
                        ).first()

                        if not loc_obj:
                            loc_obj = LectureLocation(
                                building_code=building_code,
                                room_number=room,
                                building_name=building_name
                            )
                            db.add(loc_obj)
                            db.commit()
                            logging.info(f"[update_location] 새 location 추가: {building_code} {room} {building_name}")

                        schedule.location_details = loc_obj
        db.commit()
        logging.info(f"[update_location] 강의실 위치정보 업데이트 완료")

        enriched_data = []
        for lecture in lectures:
            schedules = []
            for sched in lecture.schedules:
                schedules.append({
                    "weekday": WEEKDAYS[sched.weekday],
                    "start": sched.start_time.strftime("%H:%M"),
                    "end": sched.end_time.strftime("%H:%M"),
                    "duration": (datetime.combine(datetime.today(), sched.end_time) - datetime.combine(datetime.today(), sched.start_time)).seconds // 60,
                    "location": sched.location,
                    "location_details": {
                        "building_name": sched.location_details.building_name if sched.location_details else None,
                        "building_code": sched.location_details.building_code if sched.location_details else None,
                        "room_number": sched.location_details.room_number if sched.location_details else None
                    } if sched.location_details else None
                })
            enriched_data.append({
                "id": lecture.id,
                "name": lecture.name,
                "code": lecture.code,
                "section": lecture.section,
                "plato_course_id": lecture.plato_course_id,
                "schedules": schedules
            })

        logging.info(f"[update_location] 반환 데이터 my_lectures 개수: {len(enriched_data)}")
        return {"status": "success", "message": "강의실 위치가 업데이트되었습니다.", "my_lectures": enriched_data}

    except Exception as e:
        import traceback
        traceback.print_exc()
        logging.error(f"[update_location] 예외 발생: {e}")
        raise HTTPException(status_code=500, detail=f"업데이트 중 오류 발생: {str(e)}")


@router.get("/next")
def get_next_lecture(current_user: User = Depends(get_current_user)):
    now = datetime.now()
    today_weekday = now.weekday()  # 0 = Monday

    upcoming = None
    upcoming_lecture = None
    for lecture in show_user_lectures(current_user):
        for sched in lecture.schedules:
            if sched.weekday != today_weekday:
                continue
            start_dt = datetime.combine(now.date(), sched.start_time)
            end_dt = datetime.combine(now.date(), sched.end_time)
            if start_dt <= now <= end_dt:
                # 현재 진행 중인 강의 정보도 반환
                return {
                    "start_time": start_dt.isoformat(),
                    "end_time": end_dt.isoformat(),
                    "status": "ongoing",
                    "name": lecture.name
                }
            elif now < start_dt:
                if not upcoming or start_dt < upcoming["start"]:
                    upcoming = {
                        "start": start_dt,
                        "end": end_dt
                    }
                    upcoming_lecture = lecture

    if upcoming and upcoming_lecture:
        return {
            "start_time": upcoming["start"].isoformat(),
            "end_time": upcoming["end"].isoformat(),
            "status": "upcoming",
            "name": upcoming_lecture.name
        }
    else:
        return {"status": "none"}