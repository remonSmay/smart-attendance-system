from uuid import UUID

from pydantic import EmailStr, Field

from Models.schemas.base import ORMModel, TimestampedResponse


class UserRegister(ORMModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(pattern="^(admin|instructor)$")


class UserLogin(ORMModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(TimestampedResponse):
    full_name: str
    email: EmailStr
    role: str


class Token(ORMModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(ORMModel):
    refresh_token: str


class TokenPayload(ORMModel):
    sub: UUID
    role: str
    type: str


class AuthResponse(ORMModel):
    user: UserResponse
    tokens: Token
