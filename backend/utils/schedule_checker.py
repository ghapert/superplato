from utils.timezone_stabilizer import now_kst

def is_currently_in_lecture(schedule):
    """
    주어진 schedule 객체(강의 시간표)가
    현재 시각(now_kst 기준)과 요일, 시간 범위가 일치하는지(즉, 지금 강의 중인지) 판별하는 함수.
    - schedule.weekday: 강의 요일 (0=월, 1=화, ...)
    - schedule.start_time, schedule.end_time: 강의 시작/종료 시각 (datetime.time)
    """
    now = now_kst()
    return (
        schedule.weekday == now.weekday() and
        schedule.start_time <= now.time() <= schedule.end_time
    )