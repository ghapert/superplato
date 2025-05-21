from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from services.auth_dependency import get_current_user
from database import get_db
from models.user import User
import logging

router = APIRouter(prefix="/api/account", tags=["account"])

@router.post("/delete")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id


    # 실제 회원 탈퇴(계정 삭제)
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        # user_lecture 등 N:N 관계는 ondelete="CASCADE"로 자동 삭제됨
        db.delete(user)
        db.commit()
        logging.info(f"[회원 탈퇴] user_id={user_id}")
        return {
            "status": "success",
            "message": "회원 탈퇴가 완료되었습니다."
        }
    else:
        return {
            "status": "not_found",
            "message": "계정을 찾을 수 없습니다."
        }