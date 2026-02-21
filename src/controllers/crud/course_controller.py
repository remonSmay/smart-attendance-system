from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from Models import Course
from controllers.base_controller import CRUDBaseController
from schemas.course import CourseCreate, CourseUpdate


class CourseController(CRUDBaseController[Course]):
    def __init__(self) -> None:
        super().__init__(Course)

    async def create_course(self, db: AsyncSession, payload: CourseCreate) -> Course:
        return await self.create(db, payload.model_dump())

    async def update_course(
        self, db: AsyncSession, course: Course, payload: CourseUpdate
    ) -> Course:
        return await self.update(db, course, payload.model_dump(exclude_unset=True))

    async def search(
        self, db: AsyncSession, query: str, *, offset: int = 0, limit: int = 50
    ) -> list[Course]:
        stmt = (
            select(Course)
            .where(
                or_(
                    Course.course_name.ilike(f"%{query}%"),
                    Course.course_code.ilike(f"%{query}%"),
                )
            )
            .offset(max(offset, 0))
            .limit(max(min(limit, 100), 1))
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


course_controller = CourseController()
