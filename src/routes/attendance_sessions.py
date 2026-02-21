from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.crud.attendance_session_controller import attendance_session_controller
from helpers.database import async_get_db
from schemas.attendance_session import (
    AttendanceSessionCreate,
    AttendanceSessionResponse,
    AttendanceSessionUpdate,
)


router = APIRouter(prefix="/attendance-sessions", tags=["attendance-sessions"])


@router.post(
    "/", response_model=AttendanceSessionResponse, status_code=status.HTTP_201_CREATED
)
async def create_attendance_session(
    payload: AttendanceSessionCreate,
    db: AsyncSession = Depends(async_get_db),
):
    try:
        return await attendance_session_controller.create_session(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="session violates a uniqueness or foreign-key rule",
        ) from exc


@router.get("/", response_model=List[AttendanceSessionResponse])
async def list_attendance_sessions(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(async_get_db),
):
    return await attendance_session_controller.list_all(db, offset=offset, limit=limit)


@router.get("/active", response_model=List[AttendanceSessionResponse])
async def list_active_sessions(
    db: AsyncSession = Depends(async_get_db),
):
    return await attendance_session_controller.list_active(db)


@router.get("/{session_id}", response_model=AttendanceSessionResponse)
async def get_attendance_session(
    session_id: UUID,
    db: AsyncSession = Depends(async_get_db),
):
    session = await attendance_session_controller.get_by_id(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="session not found"
        )
    return session


@router.put("/{session_id}", response_model=AttendanceSessionResponse)
async def update_attendance_session(
    session_id: UUID,
    payload: AttendanceSessionUpdate,
    db: AsyncSession = Depends(async_get_db),
):
    session = await attendance_session_controller.get_by_id(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="session not found"
        )

    try:
        return await attendance_session_controller.update_session(db, session, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="session violates a uniqueness or foreign-key rule",
        ) from exc


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance_session(
    session_id: UUID,
    db: AsyncSession = Depends(async_get_db),
) -> None:
    session = await attendance_session_controller.get_by_id(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="session not found"
        )
    await attendance_session_controller.delete(db, session)
