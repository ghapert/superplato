import os
from datetime import datetime
import logging
import signal
import psutil

from fastapi import APIRouter, Depends, Request, Form, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from models.user import User
from utils.auth_helper import encrypt, decrypt
from database import get_db
from services.firebase import verify_firebase_token
from services.auth_dependency import get_current_user
import jwt
from datetime import datetime, timedelta, timezone
from config.config import settings
from models.user import User, ProKey

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    logging.info(f"[로그아웃] user_id={current_user.id}")
    return {"status": "success", "message": "정상적으로 로그아웃되었습니다."}

@router.get("/me")
def whoami(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "student_id": current_user.student_id,
        "student_password": bool(current_user.student_password_encrypted),
        "profile_complete": bool(current_user.name and current_user.student_id and current_user.student_password_encrypted),
        "is_admin": current_user.is_admin,
        "is_pro": current_user.is_pro
    }


@router.post("/login_firebase")
async def login_firebase(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    token = body.get("token")
    try:
        decoded_token = verify_firebase_token(token)
        email = decoded_token.get("email")
        uid = decoded_token.get("uid")
    except Exception as e:
        logging.warning(f"[Firebase 로그인 실패] {str(e)}")
        # 인증 시간 오류 메시지 안내 수정
        msg = "유효하지 않은 Firebase 토큰입니다. 다시 로그인 해주세요."
        if "Token used too early" in str(e):
            msg += (
                " (서버와 클라이언트의 '시간대'가 아니라 '시계(UTC 기준 현재 시각)'가 정확해야 합니다. "
                "운영체제의 인터넷 시간 동기화(NTP)를 반드시 확인하세요. "
                "시간대는 달라도 상관없으며, 시계가 실제 세계 표준시(UTC)와 오차 없이 맞아 있으면 됩니다.)"
            )
        # 팝업 차단 안내 추가
        if "auth/popup-blocked" in str(e):
            msg += (
                " (구글 로그인 팝업이 차단되었습니다. 브라우저의 팝업 차단 기능을 해제하고 다시 시도해 주세요. "
                "일부 브라우저에서는 주소창 오른쪽에 팝업 차단 알림이 표시될 수 있습니다.)"
            )
        return {
            "status": "error",
            "message": msg
        }

    user = db.query(User).filter_by(firebase_uid=uid).first()
    if not user:
        user = User(
            firebase_uid=uid,
            name=decoded_token.get("name", "이름없음"),
            student_id=None,
            student_password_encrypted=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = jwt.encode(
        {"user_id": user.id, "exp": datetime.now(tz=timezone.utc) + timedelta(hours=1)},
        settings.SECRET_KEY,
        algorithm="HS256"
    )

    return {
        "status": "success",
        "message": "Firebase 로그인 성공",
        "user_id": user.id,
        "token": access_token,
        "profile_complete": bool(user.name and user.student_id and user.student_password_encrypted)
    }


@router.post("/update_profile")
def update_profile(
    name: str = Form(...),
    student_id: str = Form(...),
    student_password: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 변경 전 정보 저장
    old_name = current_user.name
    old_student_id = current_user.student_id
    old_password = current_user.student_password_encrypted

    current_user.name = name
    current_user.student_id = student_id
    # "__NO_CHANGE__"이면 기존 비밀번호 유지
    if student_password != "__NO_CHANGE__":
        current_user.student_password_encrypted = encrypt(student_password)
        decrypted_password = student_password
    else:
        decrypted_password = decrypt(current_user.student_password_encrypted) if current_user.student_password_encrypted else None

    # 관리자 조건 체크
    current_user.set_admin_if_special(decrypted_password)

    db.commit()

    # 기존 runner 프로세스 종료 로직(불필요) 제거

    # 기존 runner 프로세스 종료/관리, killed_pids 등은 중앙 runner 구조에서는 필요 없음
    # auth.py에는 runner 관련 코드가 없어도 정상입니다

    return {
        "status": "success",
        "message": "정보가 성공적으로 수정되었습니다."
    }

@router.post("/verify_pro_key")
async def verify_pro_key(
    api_key: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    key = db.query(ProKey).filter_by(key=api_key).first()
    if not key:
        raise HTTPException(status_code=404, detail="해당 ProKey는 존재하지 않습니다.")
    if key.is_used:
        raise HTTPException(status_code=400, detail="이미 사용된 키입니다.")

    # 키 사용 처리
    from datetime import timezone, timedelta
    KST = timezone(timedelta(hours=9))
    key.is_used = True
    key.used_by = current_user.id
    key.used_at = datetime.now(KST)

    # 유저 프로 상태 활성화
    current_user.is_pro = True

    db.commit()

    return {"status": "success", "message": "ProKey가 정상적으로 적용되었습니다. 이제 Pro 기능을 사용할 수 있습니다."}