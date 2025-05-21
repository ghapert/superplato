from datetime import datetime

WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

def serialize_schedule(sched):
    return {
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
    }