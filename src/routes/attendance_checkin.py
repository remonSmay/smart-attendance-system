from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.crud.attendance_checkin_controller import attendance_checkin_controller
from helpers.database import async_get_db
from schemas.attendance_event import AttendanceCheckInRequest, AttendanceValidationResult


router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/check-in", response_model=AttendanceValidationResult)
async def check_in(
    payload: AttendanceCheckInRequest,
    db: AsyncSession = Depends(async_get_db),
):
    return await attendance_checkin_controller.process_checkin(db, payload)
