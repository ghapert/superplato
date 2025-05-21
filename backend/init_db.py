# init_db.py
from database import Base, engine
from models.user import User
from models.lecture import Lecture
from models.attendance import Attendance
from models.user_lecture_map import user_lecture

Base.metadata.create_all(bind=engine)
print("모든 테이블 생성 완료!")