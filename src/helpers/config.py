from pydantic_settings import BaseSettings , SettingsConfigDict
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):

    APP_NAME: str = "smart-attendance-system"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database Settings
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "attendance_user"
    DB_PASSWORD: str = "attendance_pass"
    DB_NAME: str = "smart_attendance"
    DB_SCHEMA: str = "public"
    DATABASE_URL: str = "postgresql+asyncpg://attendance_user:attendance_pass@localhost:5432/smart_attendance"

    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8"  # Optional: Specify encoding
    )
    
@lru_cache()
def get_settings() -> Settings:
    return Settings()
