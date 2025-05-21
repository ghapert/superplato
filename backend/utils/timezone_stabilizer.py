from datetime import datetime
from zoneinfo import ZoneInfo

def now_kst():
    return datetime.now(ZoneInfo("Asia/Seoul"))