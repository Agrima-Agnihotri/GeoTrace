from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RouteComparisonBase(BaseModel):
    segment_id: int
    deviation_max_m: Optional[float] = Field(None, ge=0)
    deviation_mean_m: Optional[float] = Field(None, ge=0)
    deviation_rms_m: Optional[float] = Field(None, ge=0)
    length_planned_m: Optional[float] = Field(None, ge=0)
    length_measured_m: Optional[float] = Field(None, ge=0)
    length_difference_m: Optional[float] = None
    tolerance_m: float = Field(0.5, ge=0)
    status: str
    warnings: Optional[List[str]] = None


class RouteComparisonCreate(BaseModel):
    tolerance_m: float = Field(0.5, ge=0)


class RouteComparisonUpdate(BaseModel):
    deviation_max_m: Optional[float] = Field(None, ge=0)
    deviation_mean_m: Optional[float] = Field(None, ge=0)
    deviation_rms_m: Optional[float] = Field(None, ge=0)
    length_planned_m: Optional[float] = Field(None, ge=0)
    length_measured_m: Optional[float] = Field(None, ge=0)
    length_difference_m: Optional[float] = None
    tolerance_m: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None
    warnings: Optional[List[str]] = None


class RouteComparisonResponse(RouteComparisonBase):
    id: int
    compared_at: datetime

    class Config:
        from_attributes = True