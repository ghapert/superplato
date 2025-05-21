from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base

# 강의 모델
class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(Integer, primary_key=True, index=True)  # 강의 고유 ID
    name = Column(String(120), nullable=False)           # 강의명
    code = Column(String(20), nullable=False)            # 강의 코드
    section = Column(String(10), nullable=False)         # 분반
    full_name = Column(String(150), nullable=False)      # 전체 강의명
    plato_course_id = Column(Integer, nullable=True)     # PLATO 시스템의 강의 ID

    schedules = relationship('LectureSchedule', backref='lecture', cascade="all, delete-orphan")  # 강의 시간표(1:N)
    attendances = relationship('Attendance', backref='lecture')  # 출석 기록(1:N)