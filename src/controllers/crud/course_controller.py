from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from Models import (
    AttendanceSession,
    AttendanceEvent,
    Course,
    Enrollment,
    Section,
    Student,
    User,
)
from controllers.base_controller import CRUDBaseController
from Models.schemas.course import CourseCreate, CourseUpdate


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

    async def list_course_students_with_attendance(
        self,
        db: AsyncSession,
        course_id: UUID,
        current_user: User,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> list[dict]:
        accessible_sections_stmt = select(Section.id).where(
            Section.course_id == course_id
        )
        if current_user.role == "instructor":
            accessible_sections_stmt = accessible_sections_stmt.where(
                Section.instructor_id == current_user.id
            )

        accessible_sections_subquery = accessible_sections_stmt.subquery()

        total_sessions_stmt = select(func.count(AttendanceSession.id)).where(
            AttendanceSession.section_id.in_(select(accessible_sections_subquery.c.id))
        )
        total_sessions = (await db.scalar(total_sessions_stmt)) or 0

        enrolled_students_subquery = (
            select(Enrollment.student_id.label("student_id"))
            .where(Enrollment.section_id.in_(select(accessible_sections_subquery.c.id)))
            .distinct()
            .subquery()
        )

        present_counts_subquery = (
            select(
                AttendanceEvent.student_id.label("student_id"),
                func.count(func.distinct(AttendanceEvent.attendance_session_id)).label(
                    "present_count"
                ),
            )
            .join(
                accessible_sections_subquery,
                AttendanceEvent.section_id == accessible_sections_subquery.c.id,
            )
            .where(AttendanceEvent.final_status == "Present")
            .group_by(AttendanceEvent.student_id)
            .subquery()
        )

        students_stmt = (
            select(
                Student,
                func.coalesce(present_counts_subquery.c.present_count, 0).label(
                    "present_count"
                ),
            )
            .join(
                enrolled_students_subquery,
                Student.id == enrolled_students_subquery.c.student_id,
            )
            .outerjoin(
                present_counts_subquery,
                Student.id == present_counts_subquery.c.student_id,
            )
            .order_by(Student.full_name.asc())
            .offset(max(offset, 0))
            .limit(max(min(limit, 200), 1))
        )

        student_rows = (await db.execute(students_stmt)).all()

        responses = []
        for student, present_count in student_rows:
            attendance_percentage = 0.0
            if total_sessions > 0:
                attendance_percentage = round((present_count / total_sessions) * 100, 2)

            responses.append(
                {
                    "id": student.id,
                    "created_at": student.created_at,
                    "updated_at": student.updated_at,
                    "full_name": student.full_name,
                    "email": student.email,
                    "phone": student.phone,
                    "rfid_uid": student.rfid_uid,
                    "face_reference_image": student.face_reference_image,
                    "attendance_percentage": attendance_percentage,
                }
            )

        return responses


course_controller = CourseController()
