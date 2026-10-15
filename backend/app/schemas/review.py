from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
from app.schemas.pipeline import PipelineStatus


class ReviewAction(str, Enum):
    created = "created"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"
    requested_changes = "requested_changes"
    commented = "commented"


class ReviewHistoryBase(BaseModel):
    segment_id: int
    action: ReviewAction
    previous_status: Optional[PipelineStatus] = None
    new_status: Optional[PipelineStatus] = None
    comments: Optional[str] = None


class ReviewHistoryCreate(ReviewHistoryBase):
    pass


class ReviewHistoryResponse(ReviewHistoryBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True