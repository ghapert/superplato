from sqlalchemy import Column, Integer, ForeignKey, DateTime
from datetime import datetime, timezone
from models.base import Base  # <- declarative_base()로 생성된 Base 클래스

class Attendance(Base):
    __tablename__ = 'attendance_log'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    lecture_id = Column(Integer, ForeignKey('lectures.id'), nullable=False)

    # (1) timestamp를 UTC로 저장
    timestamp = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    type = Column(Integer, default=0, nullable=False)
    #  0: 자동(기본)
    #  1: 수동요청 브루트포스
    #  2: 자동 브루트포스

    auth_code = Column(Integer, nullable=True)  # 인증코드(3자리 정수), 없으면 null

    # -- 매일 여러 개 로그가 생길 수 있으므로 UniqueConstraint는 제거 --
    # __table_args__ = (
    #     UniqueConstraint('user_id', 'lecture_id', name='uix_user_lecture_once'),
    # )

    def __repr__(self):
        return (
            f"<Attendance user={self.user_id} lecture={self.lecture_id} "
            f"at {self.timestamp} type={self.type} auth_code={self.auth_code}>"
        )