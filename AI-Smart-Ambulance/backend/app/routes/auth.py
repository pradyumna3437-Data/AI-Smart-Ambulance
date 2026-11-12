from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.middleware.auth_middleware import get_current_user_payload
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserOut
from app.services.auth_service import register_user, authenticate_user
from app.utils.validators import is_valid_role

router = APIRouter()


@router.post("/register", response_model=UserOut)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if not is_valid_role(payload.role):
        raise HTTPException(status_code=400, detail="Role must be one of: USER, DRIVER, ADMIN")
    try:
        user = register_user(db, payload.name, payload.email, payload.phone, payload.password, payload.role)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        token, user = authenticate_user(db, payload.email, payload.password)
        return TokenResponse(access_token=token, user=user)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserOut)
def get_me(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
