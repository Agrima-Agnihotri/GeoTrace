from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from datetime import datetime
from enum import Enum


class EvidenceType(str, Enum):
    video = "video"
    image = "image"
    document = "document"


class EvidenceRecordBase(BaseModel):
    project_id: int
    segment_id: Optional[int] = None
    capture_session_id: str = Field(..., min_length=1, max_length=100)
    file_path: str
    file_name: str
    file_size: int = Field(..., gt=0)
    mime_type: str
    evidence_type: EvidenceType
    sha256_hash: str = Field(..., min_length=64, max_length=64)
    duration_seconds: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    device_timestamp: Optional[datetime] = None
    gnss_latitude: Optional[float] = Field(None, ge=-90, le=90)
    gnss_longitude: Optional[float] = Field(None, ge=-180, le=180)
    gnss_accuracy_m: Optional[float] = Field(None, ge=0)
    gnss_altitude_m: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class EvidenceRecordCreate(EvidenceRecordBase):
    pass


class EvidenceRecordUpdate(BaseModel):
    segment_id: Optional[int] = None
    is_verified: Optional[bool] = None
    verification_notes: Optional[str] = None


class EvidenceRecordResponse(EvidenceRecordBase):
    id: int
    server_timestamp: datetime
    is_verified: bool
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExtractedFrameBase(BaseModel):
    evidence_id: int
    frame_number: int = Field(..., ge=0)
    timestamp_seconds: float = Field(..., ge=0)
    file_path: str
    sha256_hash: str = Field(..., min_length=64, max_length=64)
    width: Optional[int] = None
    height: Optional[int] = None
    gnss_latitude: Optional[float] = Field(None, ge=-90, le=90)
    gnss_longitude: Optional[float] = Field(None, ge=-180, le=180)
    gnss_accuracy_m: Optional[float] = Field(None, ge=0)


class ExtractedFrameCreate(ExtractedFrameBase):
    pass


class ExtractedFrameResponse(ExtractedFrameBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True