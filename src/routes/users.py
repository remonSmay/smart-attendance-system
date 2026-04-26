from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.crud.user_controller import user_controller
from helpers.database import async_get_db
from helpers.dependencies import ensure_admin, get_current_user
from Models import User
from Models.schemas.user import UserResponse


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse])
async def list_users(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)
    return await user_controller.list_users(db, offset=offset, limit=limit)
