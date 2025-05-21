from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from database import get_db
from models.user import ProKey, User
from datetime import datetime
from services.auth_dependency import get_current_user
import os
import psutil
from utils.auth_helper import decrypt
from models.lecture import Lecture
from sqlalchemy import update, and_

# 관리자 전용 API 라우터
router = APIRouter(prefix="/api/admin", tags=["admin"])

# 관리자 권한 체크 의존성
def admin_required(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return current_user

# 프로키 전체 조회
@router.get("/prokeys")
async def list_pro_keys(current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    prokeys = db.query(ProKey).all()
    return {
        "status": "success",
        "prokeys": [
            {
                "key": pk.key,
                "is_used": pk.is_used,
                "used_by": pk.used_by,
                "used_at": pk.used_at.isoformat() if pk.used_at else None
            }
            for pk in prokeys
        ]
    }

# 프로키 여러 개 생성
@router.post("/prokeys")
async def generate_pro_keys(count: int = 10, current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    import random
    import string

    def generate_cdkey():
        digits = ''.join(random.choices(string.digits, k=4))
        letters = ''.join(random.choices(string.ascii_uppercase, k=4))
        return f"PRO-{digits}-{letters}"

    created_keys = []
    for _ in range(count):
        for _ in range(10):  # 최대 10회 중복 체크
            key = generate_cdkey()
            if not db.query(ProKey).filter_by(key=key).first():
                new_key = ProKey(key=key)
                db.add(new_key)
                created_keys.append(key)
                break
    db.commit()
    return {"created": created_keys}

# 프로키 삭제
@router.delete("/prokeys/{key}")
async def delete_pro_key(key: str, current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    prokey = db.query(ProKey).filter_by(key=key).first()
    if not prokey:
        raise HTTPException(status_code=404, detail="해당 프로키가 존재하지 않습니다.")
    db.delete(prokey)
    db.commit()
    return {"status": "success", "message": f"프로키 {key}가 삭제되었습니다."}

# 전체 사용자 목록 조회
@router.get("/users")
async def list_users(current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {
        "status": "success",
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "student_id": u.student_id,
                "is_pro": u.is_pro,
                "is_admin": u.is_admin,
                "firebase_uid": u.firebase_uid
            }
            for u in users
        ]
    }

# 사용자 Pro 권한 설정
@router.post("/users/{user_id}/set_pro")
async def set_user_pro(user_id: int, value: bool, current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    user.is_pro = value
    db.commit()
    return {"status": "success", "message": f"사용자 {user_id}의 Pro 권한이 {value}로 변경되었습니다."}

# 사용자 관리자 권한 설정
@router.post("/users/{user_id}/set_admin")
async def set_user_admin(user_id: int, value: bool, current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    # 본인이 자신의 관리자 권한을 False로 변경하는 것을 방지
    if user.id == current_user.id and value is False:
        raise HTTPException(status_code=400, detail="자신의 관리자 권한을 해제할 수 없습니다.")
    user.is_admin = value
    db.commit()
    return {"status": "success", "message": f"사용자 {user_id}의 관리자 권한이 {value}로 변경되었습니다."}

# 사용자의 수강 강의(시간표 포함) 조회
@router.get("/users/{user_id}/enrolled_lectures")
async def get_user_enrolled_lectures(user_id: int, current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    """
    사용자가 수강 중인 전체 강의 목록(시간표 포함) 반환
    """
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    # user.lectures 관계 또는 별도 쿼리로 수강 강의 조회
    lectures = getattr(user, "lectures", None)
    if lectures is None:
        # 관계가 없다면 직접 쿼리 (예시)
        from models.lecture import Lecture
        lectures = db.query(Lecture).join(Lecture.users).filter(User.id == user_id).all()

    WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"]
    result = []
    for lec in lectures:
        schedules = []
        for sched in lec.schedules:
            weekday_label = WEEKDAYS[sched.weekday] if isinstance(sched.weekday, int) and 0 <= sched.weekday < 7 else str(sched.weekday)
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

# 사용자의 자동 출석 활성화 강의 목록 조회
@router.get("/users/{user_id}/auto_attendance_targets")
async def get_user_auto_attendance_targets(user_id: int, current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    """
    관리자가 특정 사용자의 자동 출석 활성화 강의 목록을 조회
    """
    from models.lecture import Lecture
    from models.user_lecture_map import user_lecture
    lecture_ids = [
        row.lecture_id
        for row in db.execute(
            user_lecture.select().where(
                (user_lecture.c.user_id == user_id) &
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

# 관리자가 특정 사용자의 자동 출석 강의 목록을 통째로 갱신
@router.post("/users/{user_id}/set_auto_attendance")
async def admin_set_auto_attendance(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    """
    관리자가 특정 사용자의 자동 출석 강의 목록을 통째로 갱신.
    body: { "lecture_ids": [1,2,3] }
    """
    data = await request.json()
    new_lecture_ids = data.get("lecture_ids", [])
    if not isinstance(new_lecture_ids, list):
        return {"status": "error", "message": "lecture_ids는 리스트여야 합니다."}

    # 1) 해당 유저의 모든 강의 OFF
    from models.user_lecture_map import user_lecture
    stmt_off = (
        update(user_lecture)
        .where(user_lecture.c.user_id == user_id)
        .values(auto_attendance_enabled=False)
    )
    db.execute(stmt_off)

    # 2) 전달받은 강의만 ON
    if new_lecture_ids:
        stmt_on = (
            update(user_lecture)
            .where(
                and_(
                    user_lecture.c.user_id == user_id,
                    user_lecture.c.lecture_id.in_(new_lecture_ids)
                )
            )
            .values(auto_attendance_enabled=True)
        )
        db.execute(stmt_on)

    db.commit()
    return {"status": "success", "message": f"자동 출석 대상이 {new_lecture_ids}로 갱신되었습니다."}

# 특정 사용자의 자동 출석 강의 목록 및 runner 상태 반환
@router.get("/users/{user_id}/runner_status")
async def get_user_runner_status(user_id: int, current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    """
    특정 사용자의 자동 출석 강의 목록 및 runner 상태 반환 (중앙 runner 구조에서는 runner_pid는 None)
    """
    from models.lecture import Lecture
    from models.user_lecture_map import user_lecture
    lecture_ids = [
        row.lecture_id
        for row in db.execute(
            user_lecture.select().where(
                (user_lecture.c.user_id == user_id) &
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
        "runner_exists": True,
        "runner_pid": None,
        "courses": result,
        "message": "중앙 runner 구조에서는 개별 runner 프로세스가 없습니다."
    }

# 전체 자동 출석 runner 현황 반환
@router.get("/runner_status/all")
async def get_all_runner_status(db: Session = Depends(get_db), current_user: User = Depends(admin_required)):
    """
    현재 자동 출석 runner가 감시 중인 모든 유저-강의 현황을 반환.
    (auto_attendance_enabled=True인 모든 user-lecture)
    """
    from models.user_lecture_map import user_lecture
    from models.user import User
    from models.lecture import Lecture

    rows = db.execute(
        user_lecture.select().where(user_lecture.c.auto_attendance_enabled == True)
    ).fetchall()

    user_ids = set(row.user_id for row in rows)
    lecture_ids = set(row.lecture_id for row in rows)

    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
    lectures = {l.id: l for l in db.query(Lecture).filter(Lecture.id.in_(lecture_ids)).all()}

    result = []
    for row in rows:
        user = users.get(row.user_id)
        lecture = lectures.get(row.lecture_id)
        if not user or not lecture:
            continue
        result.append({
            "user_id": user.id,
            "user_name": user.name,
            "student_id": user.student_id,
            "lecture_id": lecture.id,
            "lecture_name": lecture.name,
            "lecture_code": lecture.code,
            "lecture_section": lecture.section,
            "plato_course_id": lecture.plato_course_id
        })

    return {
        "status": "success",
        "count": len(result),
        "data": result
    }

# 강의 id로 강의 상세 정보 반환 (시간표 포함)
@router.get("/lectures/{lecture_id}")
async def get_lecture_by_id(
    lecture_id: int,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    강의 id로 강의 상세 정보 반환 (시간표 포함)
    """
    from models.lecture import Lecture
    lecture = db.query(Lecture).filter_by(id=lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="해당 강의를 찾을 수 없습니다.")

    WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"]
    schedules = []
    for sched in lecture.schedules:
        weekday_label = WEEKDAYS[sched.weekday] if 0 <= sched.weekday < 7 else str(sched.weekday)
        schedules.append({
            "weekday": weekday_label,
            "start": sched.start_time.strftime("%H:%M"),
            "end": sched.end_time.strftime("%H:%M"),
            "location": getattr(sched, "location", None)
        })

    return {
        "status": "success",
        "lecture": {
            "lecture_id": lecture.id,
            "plato_course_id": lecture.plato_course_id,
            "lecture_name": lecture.name,
            "code": lecture.code,
            "section": lecture.section,
            "schedules": schedules
        }
    }

# 특정 사용자의 모든 출석기록 반환 (최신순)
@router.get("/users/{user_id}/attendances")
async def get_user_attendances(
    user_id: int,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    특정 사용자의 모든 출석기록 반환 (최신순)
    """
    from models.attendance import Attendance
    from models.lecture import Lecture

    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    attendances = (
        db.query(Attendance)
        .filter(Attendance.user_id == user_id)
        .order_by(Attendance.timestamp.desc())
        .all()
    )

    # 강의 id → 강의명 매핑을 위해 미리 조회
    lecture_ids = {a.lecture_id for a in attendances}
    lectures = {l.id: l for l in db.query(Lecture).filter(Lecture.id.in_(lecture_ids)).all()}

    result = []
    for a in attendances:
        lec = lectures.get(a.lecture_id)
        result.append({
            "attendance_id": a.id,  # 출석 고유 ID
            "lecture_id": a.lecture_id,  # 강의 ID
            "lecture_name": lec.name if lec else None,  # 강의명
            "timestamp": a.timestamp.isoformat(),  # 출석 시각
            "type": a.type,  # 출석 타입
            "auth_code": a.auth_code  # 인증 코드
        })

    return {
        "status": "success",
        "count": len(result),
        "attendances": result
    }