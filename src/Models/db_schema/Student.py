from __future__ import annotations
from uuid import UUID
from pydantic import BaseModel, ConfigDict , EmailStr, Field

class StudentCreate(BaseModel):
    full_name : str = Field(..., description="the full name from student ")
    email : EmailStr
    phone : int | None = None
    rfid_uid : str #TODO : check the uid from rfid is str or unique uid 
    face_reference_image : str #TODO :  filePath from pydantic for image url 


class  StudentRead(BaseModel):
    id : UUID 
    full_name : str 
    email : EmailStr | None = None
    phone : int | None = None
    rfid_uid : str
    face_reference_image : str 

    model_config = ConfigDict(
        from_attributes=True
    )  # to allow reading from ORM attributes

# from pathlib import Path
# from pydantic import BaseModel, FilePath
# from typing import Annotated, PathType

# FilePath = Annotated[Path, PathType("file")]


# class Product(BaseModel):
#     name: str
#     image_path: FilePath  # Validates file exists on disk


# # Usage
# product = Product(name="Product", image_path="/path/to/image.jpg")
