from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Smart Attendance System"
    APP_VERSION: str = "0.1.0"
    
    
    
    
    class Config:
        env_file = ".env"

def get_settings() -> Settings:
    return Settings()