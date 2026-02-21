from pydantic import Field

from schemas.base import ORMModel, TimestampedResponse


class CourseCreate(ORMModel):
    course_name: str = Field(min_length=2, max_length=100)
    course_code: str = Field(min_length=2, max_length=20)


class CourseUpdate(ORMModel):
    course_name: str | None = Field(default=None, min_length=2, max_length=100)
    course_code: str | None = Field(default=None, min_length=2, max_length=20)


class CourseResponse(TimestampedResponse):
    course_name: str
    course_code: str
