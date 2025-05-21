from sqlalchemy import Column, Integer, String, UniqueConstraint
from models.base import Base

class LectureLocation(Base):
    __tablename__ = 'lecture_location'

    id = Column(Integer, primary_key=True)
    building_code = Column(String(10), nullable=True)  # 예: "102"
    room_number = Column(String(10), nullable=True)    # 예: "103"
    building_name = Column(String(100), nullable=True)  # 예: "컴퓨터공학관"
    full_label = Column(String(150), nullable=True)     # 예: "컴퓨터공학관 201호"

    __table_args__ = (UniqueConstraint('building_code', 'room_number', name='unique_location'),)

    def __repr__(self):
        return f"&lt;LectureLocation {self.building_name} {self.room_number}&gt;"