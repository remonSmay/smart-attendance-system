from datetime import datetime, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from Models import AttendanceSession
from controllers.base_controller import CRUDBaseController
from schemas.attendance_session import AttendanceSessionCreate, AttendanceSessionUpdate


class AttendanceSessionController(CRUDBaseController[AttendanceSession]):
    def __init__(self) -> None:
        super().__init__(AttendanceSession)

    async def create_session(
        self,
        db: AsyncSession,
        payload: AttendanceSessionCreate,
    ) -> AttendanceSession:
        if payload.end_time <= payload.start_time:
            raise ValueError("end_time must be after start_time")

        active_stmt = select(AttendanceSession).where(
            and_(
                AttendanceSession.section_id == payload.section_id,
                AttendanceSession.is_active.is_(True),
            )
        )
        active_session = (await db.execute(active_stmt)).scalar_one_or_none()
        if active_session:
            raise ValueError("an active session already exists for this section")

        return await self.create(db, payload.model_dump())

    async def update_session(
        self,
        db: AsyncSession,
        session: AttendanceSession,
        payload: AttendanceSessionUpdate,
    ) -> AttendanceSession:
        update_data = payload.model_dump(exclude_unset=True)
        next_start = update_data.get("start_time", session.start_time)
        next_end = update_data.get("end_time", session.end_time)
        if next_end <= next_start:
            raise ValueError("end_time must be after start_time")

        if update_data.get("is_active") is True and not session.is_active:
            active_stmt = select(AttendanceSession).where(
                and_(
                    AttendanceSession.section_id == session.section_id,
                    AttendanceSession.is_active.is_(True),
                    AttendanceSession.id != session.id,
                )
            )
            active_session = (await db.execute(active_stmt)).scalar_one_or_none()
            if active_session:
                raise ValueError(
                    "cannot activate session: another active session exists"
                )

        return await self.update(db, session, update_data)

    async def list_active(self, db: AsyncSession) -> list[AttendanceSession]:
        now = datetime.now(timezone.utc)
        stmt = select(AttendanceSession).where(
            and_(
                AttendanceSession.is_active.is_(True),
                AttendanceSession.start_time <= now,
                AttendanceSession.end_time >= now,
            )
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


attendance_session_controller = AttendanceSessionController()
