from datetime import datetime, timedelta

def calc_end_time(start_time_str, duration_min):
    start_dt = datetime.strptime(start_time_str, "%H:%M")
    end_dt = start_dt + timedelta(minutes=int(duration_min))
    return end_dt.strftime("%H:%M")