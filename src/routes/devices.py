from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.crud.attendance_checkin_controller import attendance_checkin_controller
from controllers.crud.device_controller import device_controller
from helpers.database import async_get_db
from helpers.dependencies import get_current_user, ensure_admin
from Models import AttendanceSession, Student, User
from Models.schemas.attendance_event import AttendanceCheckInRequest
from Models.schemas.device import (
    DeviceCreate,
    DeviceResponse,
    DeviceRFIDCheckinRequest,
    DeviceRFIDCheckinResponse,
    DeviceUpdate,
)


router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(
    payload: DeviceCreate,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)
    try:
        return await device_controller.create_device(db, payload)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="device violates a uniqueness or foreign-key rule",
        ) from exc


@router.get("/", response_model=list[DeviceResponse])
async def list_devices(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    return await device_controller.list_all(db, offset=offset, limit=limit)


@router.post("/checkin", response_model=DeviceRFIDCheckinResponse)
async def device_rfid_checkin(
    payload: DeviceRFIDCheckinRequest,
    db: AsyncSession = Depends(async_get_db),
):
    # Temporary no-auth mode for device bring-up; replace with X-Device-Key validation.
    student = await db.scalar(
        select(Student).where(Student.rfid_uid == payload.rfid_uid)
    )
    if not student:
        return DeviceRFIDCheckinResponse(
            accepted=False,
            student_name=None,
            reason="student not found for RFID",
        )

    session = await db.scalar(
        select(AttendanceSession).where(
            AttendanceSession.id == payload.attendance_session_id
        )
    )
    if not session:
        return DeviceRFIDCheckinResponse(
            accepted=False,
            student_name=student.full_name,
            reason="session not found",
        )

    checkin_payload = AttendanceCheckInRequest(
        student_id=student.id,
        attendance_session_id=payload.attendance_session_id,
        section_id=session.section_id,
        device_id=payload.device_id,
        method_used="RFID",
        similarity_score=None,
    )
    result = await attendance_checkin_controller.process_checkin(db, checkin_payload)

    return DeviceRFIDCheckinResponse(
        accepted=result.accepted,
        student_name=student.full_name,
        reason=result.reason,
    )


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: UUID,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="device not found"
        )
    return device


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: UUID,
    payload: DeviceUpdate,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="device not found"
        )

    try:
        return await device_controller.update_device(db, device, payload)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="device violates a uniqueness or foreign-key rule",
        ) from exc


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: UUID,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="device not found"
        )
    await device_controller.delete(db, device)
