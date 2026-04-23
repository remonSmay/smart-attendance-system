import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Allow frontend dev server to call API during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(base_router)


if __name__ == "__main__":

    uvicorn.run(app, host="0.0.0.0", port=8000)


"""
TODO [first][done]: database connection and database schema
    understand the SQl database 
    ORM -> Object Relational Mapping (SQLAlchemy) -> convert OOP to database tables 
    engine -> the connection to the database (URL) bridge between python and database
    session -> the communication channel with the database (manage connections, track objects (identity map), buffer changes, handle transactions (flush/commit/rollback).)
    base(declarative base) -> the base class for all ORM models (tables) will convert python classes to database tables(metadata)
    
    -> models (tables) -> CRUD operations
    
TODO: auth(login+roles) :Next step I recommend: add RBAC + auth guards on these endpoints (admin, instructor, device) and then Postman collection tests for the full check-in flow

TODO : start and stop attendance
FIXME
"""


"""
# done [database model and schema database ] with auditLog (for log the system but in the database )
# done [CRUD for database with check-in ]
# done [API rearouse ]



User : the use the system , instructor the Section (entity)
Student : enrollment in Section , has the Attendance Records 
Course : the subject like (database , operation system , ai ) , has the Sections(entity)
Section : the course has the group of one Course  
Enrollment : has (student_id , section_id) like ((1, 10 ), (2,10)) , has the store the student in course
Device : the device 
AttendanceEvent : the hart of system , 
    (attendance_id	معرف الحضور
    student_id	الطالب
    section_id	السكشن
    device_id	الجهاز
    method_used	RFID / FACE / MANUAL
    final_status	Present / Absent / Late
    timestamp	وقت الحضور)
"""
"""
sudo lsof -i tcp:5432
sudo kill -9 2795
"""
