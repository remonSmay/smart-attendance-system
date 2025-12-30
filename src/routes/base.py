from fastapi import APIRouter, FastAPI, Depends
from helpers.config import Settings, get_settings

base_router = APIRouter(tags=["api_v1"], prefix="/api/v1")


@base_router.get("/")
async def welcome(app_settings: Settings = Depends(get_settings)):
    app_name = app_settings.APP_NAME
    app_version = app_settings.APP_VERSION
    return {
        "message": "Welcome to the API",
        "app_name": app_name,
        "app_version": app_version,
    }
