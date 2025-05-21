from models.base import Base
from sqlalchemy import Column, Integer, ForeignKey, Time, String
from sqlalchemy.orm import relationship

class LectureSchedule(Base):
    __tablename__ = "lecture_schedule"

    id = Column(Integer, primary_key=True)  # 고유 식별자
    lecture_id = Column(Integer, ForeignKey('lectures.id'), nullable=False)  # 강의 ID (외래키)
    weekday = Column(Integer, nullable=False)  # 요일 (0=월, 1=화, ...)
    start_time = Column(Time, nullable=False)  # 강의 시작 시간
    end_time = Column(Time, nullable=False)    # 강의 종료 시간
    duration = Column(Integer, nullable=False) # 강의 시간(분 단위)
    location = Column(String(100), nullable=True)  # 강의실(텍스트)
    lecture_location_id = Column(Integer, ForeignKey('lecture_location.id'), nullable=True)  # 강의실 ID (외래키)
    location_details = relationship('LectureLocation', backref='schedules')  # 강의실 상세정보(관계)