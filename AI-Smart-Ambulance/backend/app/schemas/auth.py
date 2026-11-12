from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserOut


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    password: str = Field(..., min_length=6, max_length=72)
    role: str = "USER"  # USER | DRIVER | ADMIN


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut | None = None
