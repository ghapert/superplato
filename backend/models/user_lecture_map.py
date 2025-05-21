# models/user_lecture_map.py 예시
from sqlalchemy import Table, Column, Integer, ForeignKey, Boolean, text
from models.base import Base

user_lecture = Table(
    'user_lecture',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    Column('lecture_id', Integer, ForeignKey('lectures.id', ondelete="CASCADE"), primary_key=True),
    Column('auto_attendance_enabled', Boolean, default=False, server_default=text("0")),
    # 새로 추가
    Column('attendance_in_progress', Boolean, default=False, nullable=False, server_default=text("0")),
)