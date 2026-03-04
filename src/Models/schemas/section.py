from datetime import datetime
from uuid import UUID

from pydantic import Field

from Models.schemas.base import ORMModel, TimestampedResponse


class SectionCreate(ORMModel):
    course_id: UUID
    instructor_id: UUID
    section_name: str = Field(min_length=2, max_length=50)
    schedule_time: datetime


class SectionUpdate(ORMModel):
    course_id: UUID | None = None
    instructor_id: UUID | None = None
    section_name: str | None = Field(default=None, min_length=2, max_length=50)
    schedule_time: datetime | None = None


class SectionResponse(TimestampedResponse):
    course_id: UUID
    instructor_id: UUID
    section_name: str
    schedule_time: datetime
