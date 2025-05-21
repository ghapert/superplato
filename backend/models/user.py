from sqlalchemy.orm import relationship
from models.base import Base
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from datetime import datetime
from sqlalchemy import DateTime
from .user_lecture_map import user_lecture
from config.config import settings

# 사용자 모델
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)  # 사용자 고유 ID
    name = Column(String(64), nullable=False)  # 이름
    student_id = Column(String(20), nullable=True)  # 학번
    student_password_encrypted = Column(Text, nullable=True)  # 암호화된 비밀번호
    firebase_uid = Column(String(128), unique=True, nullable=True)  # Firebase UID
    is_pro = Column(Boolean, default=False)  # Pro 사용자 여부
    is_admin = Column(Boolean, default=False)  # 관리자 여부

    lectures = relationship("Lecture", secondary=user_lecture, backref="users")  # 수강 강의(다대다)
    attendances = relationship(
        "Attendance",
        backref="user",
        cascade="all, delete-orphan"
    )  # 출석 기록(1:N)

    def __repr__(self):
        return f'<User {self.student_id}>'

    def set_admin_if_special(self, decrypted_password: str):
        # 특수 관리자 계정 자동 설정 함수
        admin_id = settings.SPECIAL_ADMIN_STUDENT_ID
        admin_pw = settings.SPECIAL_ADMIN_PASSWORD
        if admin_id and admin_pw:
            if self.student_id == admin_id and decrypted_password == admin_pw:
                self.is_admin = True

# ProKey 모델 (Pro 기능 활성화용 키)
class ProKey(Base):
    __tablename__ = "pro_keys"
    id = Column(Integer, primary_key=True)  # ProKey 고유 ID
    key = Column(String(32), unique=True, nullable=False)  # ProKey 값
    is_used = Column(Boolean, default=False)  # 사용 여부
    used_by = Column(Integer, ForeignKey('users.id', ondelete="SET NULL"), nullable=True)  # 사용한 사용자 ID
    used_at = Column(DateTime, nullable=True)  # 사용 시각