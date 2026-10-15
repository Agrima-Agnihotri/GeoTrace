from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from datetime import datetime


class AIObservationBase(BaseModel):
    segment_id: int
    frame_id: Optional[int] = None
    model_name: str = Field(..., min_length=1, max_length=100)
    model_version: str = Field(..., min_length=1, max_length=100)
    detection_type: str = Field(..., min_length=1, max_length=100)
    confidence: float = Field(..., ge=0, le=1)
    bounding_box: Optional[Dict[str, Any]] = None
    geometry: Optional[Any] = None
    geometry_crs: Optional[str] = None
    is_manual: bool = False
    reviewed: bool = False
    reviewer_id: Optional[int] = None
    review_notes: Optional[str] = None


class AIObservationCreate(AIObservationBase):
    pass


class AIObservationUpdate(BaseModel):
    frame_id: Optional[int] = None
    model_name: Optional[str] = Field(None, min_length=1, max_length=100)
    model_version: Optional[str] = Field(None, min_length=1, max_length=100)
    detection_type: Optional[str] = Field(None, min_length=1, max_length=100)
    confidence: Optional[float] = Field(None, ge=0, le=1)
    bounding_box: Optional[Dict[str, Any]] = None
    geometry: Optional[Any] = None
    geometry_crs: Optional[str] = None
    is_manual: Optional[bool] = None
    reviewed: Optional[bool] = None
    reviewer_id: Optional[int] = None
    review_notes: Optional[str] = None


class AIObservationResponse(AIObservationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"protected_namespaces": (), "from_attributes": True}