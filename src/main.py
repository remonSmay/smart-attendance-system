from fastapi import FastAPI
import uvicorn
from contextlib import asynccontextmanager
from helpers.database import close_db, init_db

from routes import base_router


@asynccontextmanager 
async def lifespan(app: FastAPI):
    # startup
    await init_db()
    yield
    # shutdown
    await close_db()


app = FastAPI(
    title="My FastAPI Application Backend about Smart Attendance ",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(base_router)


if __name__ == "__main__":
    
    uvicorn.run(app, host="0.0.0.0", port=8000)


"""
TODO [first]: database connection and database schema
    understand the SQl database 
    ORM -> Object Relational Mapping (SQLAlchemy) -> convert OOP to database tables 
    engine -> the connection to the database (URL) bridge between python and database
    session -> the communication channel with the database (manage connections, track objects (identity map), buffer changes, handle transactions (flush/commit/rollback).)
    base(declarative base) -> the base class for all ORM models (tables) will convert python classes to database tables(metadata)
    
    -> models (tables) -> CRUD operations
    
TODO: auth(login+roles) 

TODO : start and stop attendance
FIXME
"""
