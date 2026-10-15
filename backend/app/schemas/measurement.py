from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class MeasurementMethod(str, Enum):
    gps = "gps"
    total_station = "total_station"
    tape = "tape"
    lidar = "lidar"
    photogrammetry = "photogrammetry"
    unknown = "unknown"


class MeasurementBase(BaseModel):
    measurement_type: str = Field(..., min_length=1, max_length=100)
    value: float
    unit: str = Field(..., min_length=1, max_length=50)
    reference_surface: Optional[str] = Field(None, max_length=100)
    datum: Optional[str] = Field(None, max_length=100)
    method: MeasurementMethod
    accuracy: Optional[float] = Field(None, ge=0)
    source: Optional[str] = Field(None, max_length=255)
    measured_at: Optional[datetime] = None
    notes: Optional[str] = None


class MeasurementCreate(MeasurementBase):
    pass


class MeasurementUpdate(BaseModel):
    measurement_type: Optional[str] = Field(None, min_length=1, max_length=100)
    value: Optional[float] = None
    unit: Optional[str] = Field(None, min_length=1, max_length=50)
    reference_surface: Optional[str] = Field(None, max_length=100)
    datum: Optional[str] = Field(None, max_length=100)
    method: Optional[MeasurementMethod] = None
    accuracy: Optional[float] = Field(None, ge=0)
    source: Optional[str] = Field(None, max_length=255)
    measured_at: Optional[datetime] = None
    notes: Optional[str] = None


class MeasurementResponse(MeasurementBase):
    id: int
    segment_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True