from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.crud.device_controller import device_controller
from helpers.database import async_get_db
from schemas.device import DeviceCreate, DeviceResponse, DeviceUpdate


router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(payload: DeviceCreate, db: AsyncSession = Depends(async_get_db)):
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
):
    return await device_controller.list_all(db, offset=offset, limit=limit)


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: UUID, db: AsyncSession = Depends(async_get_db)):
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device not found")
    return device


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: UUID,
    payload: DeviceUpdate,
    db: AsyncSession = Depends(async_get_db),
):
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device not found")

    try:
        return await device_controller.update_device(db, device, payload)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="device violates a uniqueness or foreign-key rule",
        ) from exc


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(device_id: UUID, db: AsyncSession = Depends(async_get_db)):
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device not found")
    await device_controller.delete(db, device)
