from fastapi import FastAPI
from contextlib import asynccontextmanager
from helpers.database import close_db ,init_db

from routes import base_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    #startup
    await init_db()
    yield
    #shutdown
    await close_db()


app = FastAPI(title="My FastAPI Application Backend about Smart Attendance ", version="0.1.0" , lifespan=lifespan)

app.include_router(base_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


"""
TODO [first]: database connection and database schema
    
TODO: auth(login+roles) 

TODO : start and stop attendance
FIXME
"""
