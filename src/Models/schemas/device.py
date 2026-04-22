from uuid import UUID

from pydantic import Field

from Models.schemas.base import ORMModel, TimestampedResponse


class DeviceCreate(ORMModel):
    device_name: str = Field(min_length=2, max_length=100)
    location: str | None = Field(default=None, max_length=100)


class DeviceUpdate(ORMModel):
    device_name: str | None = Field(default=None, min_length=2, max_length=100)
    location: str | None = Field(default=None, max_length=100)


class DeviceResponse(TimestampedResponse):
    device_name: str
    location: str | None


class DeviceRFIDCheckinRequest(ORMModel):
    device_id: UUID
    rfid_uid: str = Field(min_length=1, max_length=50)
    attendance_session_id: UUID


class DeviceRFIDCheckinResponse(ORMModel):
    accepted: bool
    student_name: str | None = None
    reason: str
