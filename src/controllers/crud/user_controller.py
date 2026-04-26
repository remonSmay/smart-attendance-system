from sqlalchemy.ext.asyncio import AsyncSession

from Models import User
from controllers.base_controller import CRUDBaseController


class UserController(CRUDBaseController[User]):
    def __init__(self) -> None:
        super().__init__(User)

    async def list_users(
        self, db: AsyncSession, *, offset: int = 0, limit: int = 50
    ) -> list[User]:
        return await self.list_all(db, offset=offset, limit=limit)


user_controller = UserController()
