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
