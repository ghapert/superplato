import sys
import os

# backend 폴더를 파이썬 모듈 경로에 추가 (최상단에 위치해야 함)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import update
from sqlalchemy.orm import sessionmaker
from database import engine
from models.user import User
from models.lecture import Lecture
from models.user_lecture_map import user_lecture
from models.attendance import Attendance
from utils.auth_helper import decrypt
import random
import logging
import os
import subprocess

LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_PATH = os.path.join(LOG_DIR, "auto_attendance_runner.log")

SessionLocal = sessionmaker(bind=engine)

def already_attended_today(db, user_id, lecture_id):
    """
    KST 기준으로 오늘(0시~24시) 범위 안에 해당 user+lecture 출석이 있는지 확인
    (timestamp는 UTC 저장이므로 범위를 UTC로 변환)
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
    return (attendance is not None)

def get_soonest_next_start_time(db):
    """
    오늘 남은 강의 스케줄 중 가장 가까운 시작 시각(KST)을 datetime으로 반환.
    없으면 None.
    """
    KST = timezone(timedelta(hours=9))
    now = datetime.now(KST)
    weekday = now.weekday()
    candidates = []

    rows = db.execute(
        user_lecture.select().where(user_lecture.c.auto_attendance_enabled == True)
    ).fetchall()

    for row in rows:
        user = db.query(User).filter_by(id=row.user_id, is_pro=True).first()
        lecture = db.query(Lecture).filter_by(id=row.lecture_id).first()
        if not user or not lecture:
            continue

        for sched in lecture.schedules:
            if sched.weekday == weekday:
                start_dt = datetime(
                    now.year, now.month, now.day,
                    sched.start_time.hour,
                    sched.start_time.minute,
                    tzinfo=KST
                )
                if start_dt > now:
                    candidates.append(start_dt)

    if not candidates:
        return None
    return min(candidates)

def any_ongoing_lecture(db):
    """
    현재 시간(KST)에 진행 중인 (auto_attendance_enabled=True) 강의가
    하나라도 있으면 True, 없으면 False
    """
    KST = timezone(timedelta(hours=9))
    now = datetime.now(KST)
    weekday = now.weekday()
    current_hm = now.strftime("%H:%M")

    rows = db.execute(
        user_lecture.select().where(user_lecture.c.auto_attendance_enabled == True)
    ).fetchall()

    for row in rows:
        user = db.query(User).filter_by(id=row.user_id, is_pro=True).first()
        lecture = db.query(Lecture).filter_by(id=row.lecture_id).first()
        if not user or not lecture:
            continue

        for sched in lecture.schedules:
            if sched.weekday == weekday:
                if sched.start_time.strftime("%H:%M") <= current_hm <= sched.end_time.strftime("%H:%M"):
                    return True
    return False

async def auto_attendance_runner_loop():
    """
    - DB에서 (auto_attendance_enabled=True)인 user-lecture를 확인
    - 현재 시간에 해당되는 스케줄이면 출석 시도를 진행
    - 이미 오늘 출석했거나, attendance_in_progress=True 인 경우는 스킵
    - 각 출석은 3개의 worker 스크립트(subprocess)로 병렬 실행
    - Sleep 간격: 수업 중 10초, 임박시 10초, 일반시 300초, 남은 수업 없으면 900초
    """
    logging.info("[auto_attendance_runner_loop] 시작")
    KST = timezone(timedelta(hours=9))

    while True:
        db = SessionLocal()
        now = datetime.now(KST)
        weekday = now.weekday()
        current_time = now.strftime("%H:%M")

        # 1) auto_attendance_enabled=True 인 것 조회
        rows = db.execute(
            user_lecture.select().where(user_lecture.c.auto_attendance_enabled == True)
        ).fetchall()
        logging.debug(f"[DB조회] auto_attendance_enabled=True => {len(rows)}개")

        # 2) 스케줄에 따라 현재 시간대면 worker 실행
        found_targets = False
        for row in rows:
            user = db.query(User).filter_by(id=row.user_id, is_pro=True).first()
            lecture = db.query(Lecture).filter_by(id=row.lecture_id).first()
            if not user or not lecture:
                continue

            # ==== (A) 이미 오늘 출석했으면 스킵 ====
            if already_attended_today(db, user.id, lecture.id):
                continue

            # ==== (B) 이미 in_progress이면 스킵 ====
            if row.attendance_in_progress:
                logging.debug(f"[SKIP] in_progress=True → user={row.user_id}, lecture={row.lecture_id}")
                continue

            # ==== (C) 현재 시간대가 해당 강의 스케줄인지 확인 ====
            for sched in lecture.schedules:
                if (
                    sched.weekday == weekday
                    and sched.start_time.strftime("%H:%M") <= current_time <= sched.end_time.strftime("%H:%M")
                ):
                    # 여기에 왔다는 건 출석 가능 시간임
                    found_targets = True

                    # 1) in_progress = True 로 업데이트
                    stmt = (
                        update(user_lecture).
                        where(
                            (user_lecture.c.user_id == user.id) &
                            (user_lecture.c.lecture_id == lecture.id)
                        ).
                        values(attendance_in_progress=True)
                    )
                    db.execute(stmt)
                    db.commit()

                    # 2) Worker 서브프로세스를 "3개" 실행
                    python_exec = sys.executable
                    worker_scripts = [
                        "auto_attendance_worker_part1.py",
                        "auto_attendance_worker_part2.py",
                        "auto_attendance_worker_part3.py"
                    ]
                    for w_script in worker_scripts:
                        worker_path = os.path.join(os.path.dirname(__file__), w_script)
                        logging.info(
                            f"[subprocess] 출석 시도: user_id={user.id}, lecture_id={lecture.id}, time={current_time}, script={w_script}"
                        )
                        subprocess.Popen([
                            python_exec,
                            worker_path,
                            "--user_id", str(user.id),
                            "--lecture_id", str(lecture.id)
                        ])

                    # 같은 user-lecture에 대해 중복 실행하지 않도록, 여기서 break
                    break

        db.close()

        if not found_targets:
            logging.debug("[출석 시도 대상 없음]")

        # 3) 다음 루프까지 대기
        db = SessionLocal()
        in_session = any_ongoing_lecture(db)
        next_start = get_soonest_next_start_time(db)
        db.close()

        if in_session:
            sleep_secs = 10
            logging.debug("현재 수업 중 → 10초 뒤 재확인")
        else:
            if not next_start:
                sleep_secs = 900
                logging.debug("오늘 남은 수업 없음 → 15분 뒤 재확인")
            else:
                diff = (next_start - datetime.now(KST)).total_seconds()
                if diff <= 20 * 60:
                    sleep_secs = 10
                    logging.debug(f"수업 시작 임박({diff:.0f}초 남음) → 10초 뒤 재확인")
                else:
                    sleep_secs = 300
                    logging.debug(f"다음 수업까지 {diff:.0f}초 남음 → 5분 뒤 재확인")

        logging.debug(f"🕒 다음 체크까지 {sleep_secs}초 대기")
        await asyncio.sleep(sleep_secs)

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

    logging.info("[main] auto_attendance_runner 시작!")
    asyncio.run(auto_attendance_runner_loop())

if __name__ == "__main__":
    main()