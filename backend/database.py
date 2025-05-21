from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from config.config import settings  # settings 객체 가져오기
from models.base import Base

engine = create_engine(settings.SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 요청마다 DB 세션을 생성하고, 끝나면 자동 종료
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
