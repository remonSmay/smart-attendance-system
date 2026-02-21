from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from Models import Student
from controllers.base_controller import CRUDBaseController
from schemas.student import StudentCreate, StudentUpdate


class StudentController(CRUDBaseController[Student]):
    def __init__(self) -> None:
        super().__init__(Student)

    async def create_student(self, db: AsyncSession, payload: StudentCreate) -> Student:
        return await self.create(db, payload.model_dump())

    async def update_student(
        self, db: AsyncSession, student: Student, payload: StudentUpdate
    ) -> Student:
        return await self.update(db, student, payload.model_dump(exclude_unset=True))

    async def search(
        self, db: AsyncSession, query: str, *, offset: int = 0, limit: int = 50
    ) -> list[Student]:
        stmt = (
            select(Student)
            .where(
                or_(
                    Student.full_name.ilike(f"%{query}%"),
                    Student.email.ilike(f"%{query}%"),
                    Student.rfid_uid.ilike(f"%{query}%"),
                )
            )
            .offset(max(offset, 0))
            .limit(max(min(limit, 100), 1))
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


student_controller = StudentController()
