from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, attendance, account, lectures, admin, assignment
import subprocess
 
import os
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from database import SessionLocal
from models.user import User
import sys
import psutil

MODTIME_CACHE = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.environ.get("RUN_MAIN") == "true" or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        yield
        return

    db: Session = SessionLocal()
    try:
        users = db.query(User).all()
        yield
    finally:
        db.close()

app = FastAPI(lifespan=lifespan)

# CORS 허용 (개발 시 * / 배포 시 특정 origin으로)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ex: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 연결
app.include_router(auth.router)#, prefix="/api/auth", tags=["Auth"])
app.include_router(account.router)#, prefix="/api/account", tags=["Account"])
app.include_router(attendance.router)#, prefix="/api/attendance", tags=["Attendance"])
app.include_router(lectures.router)#, prefix="/api/lectures", tags=["Lectures"])
app.include_router(admin.router)#, prefix="/api/admin", tags=["Admin"])
app.include_router(assignment.router)#, prefix="/api/assignment", tags=["Assignment"])


from models import Base
from database import engine

Base.metadata.create_all(bind=engine)