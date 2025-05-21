# config/config.py
import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# .env 명시적으로 로드
load_dotenv()

class Settings(BaseSettings):
    SQLALCHEMY_DATABASE_URL: str
    SECRET_KEY: str
    FERNET_KEY: str
    DEBUG: bool = False
    # When provided, a user matching these credentials will automatically
    # receive admin privileges after profile update. Values are read from
    # the SPECIAL_ADMIN_STUDENT_ID and SPECIAL_ADMIN_PASSWORD environment
    # variables.
    SPECIAL_ADMIN_STUDENT_ID: str | None = None
    SPECIAL_ADMIN_PASSWORD: str | None = None

settings = Settings()