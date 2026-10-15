from pydantic import BaseModel, Field
from typing import Optional, Any, List
from datetime import datetime
from enum import Enum


class UtilityType(str, Enum):
    water = "water"
    gas = "gas"
    sewage = "sewage"
    electrical = "electrical"
    telecom = "telecom"


class PipelineStatus(str, Enum):
    planned = "planned"
    draft = "draft"
    pending_verification = "pending_verification"
    pending_review = "pending_review"
    approved = "approved"
    rejected = "rejected"
    needs_additional_evidence = "needs_additional_evidence"


class PipelineAssetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    utility_type: UtilityType
    material: Optional[str] = Field(None, max_length=100)
    diameter_mm: Optional[int] = Field(None, gt=0)
    installation_date: Optional[datetime] = None
    description: Optional[str] = None


class PipelineAssetCreate(PipelineAssetBase):
    status: PipelineStatus = PipelineStatus.planned


class PipelineAssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    utility_type: Optional[UtilityType] = None
    material: Optional[str] = Field(None, max_length=100)
    diameter_mm: Optional[int] = Field(None, gt=0)
    installation_date: Optional[datetime] = None
    status: Optional[PipelineStatus] = None
    description: Optional[str] = None


class PipelineAssetResponse(PipelineAssetBase):
    id: int
    project_id: int
    status: PipelineStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PipelineSegmentBase(BaseModel):
    segment_type: str = "pipe"
    geometry_planned: Optional[Any] = None
    geometry_draft: Optional[Any] = None
    geometry_approved: Optional[Any] = None
    geometry_crs: str = "EPSG:4326"
    length_m: Optional[float] = Field(None, ge=0)
    depth_m: Optional[float] = None
    depth_reference: Optional[str] = Field(None, max_length=100)
    depth_method: Optional[str] = Field(None, max_length=50)
    depth_confidence: Optional[float] = Field(None, ge=0, le=1)
    accuracy_m: Optional[float] = Field(None, ge=0)
    source: Optional[str] = Field(None, max_length=255)
    version: int = 1
    status: PipelineStatus = PipelineStatus.planned
    notes: Optional[str] = None


class PipelineSegmentCreate(PipelineSegmentBase):
    pass


class PipelineSegmentUpdate(BaseModel):
    segment_type: Optional[str] = None
    geometry_planned: Optional[Any] = None
    geometry_draft: Optional[Any] = None
    geometry_approved: Optional[Any] = None
    geometry_crs: Optional[str] = None
    length_m: Optional[float] = Field(None, ge=0)
    depth_m: Optional[float] = None
    depth_reference: Optional[str] = Field(None, max_length=100)
    depth_method: Optional[str] = Field(None, max_length=50)
    depth_confidence: Optional[float] = Field(None, ge=0, le=1)
    accuracy_m: Optional[float] = Field(None, ge=0)
    source: Optional[str] = Field(None, max_length=255)
    version: Optional[int] = None
    status: Optional[PipelineStatus] = None
    notes: Optional[str] = None


class PipelineSegmentResponse(PipelineSegmentBase):
    id: int
    asset_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True