from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.session import Base


class ReviewAction(str, enum.Enum):
    created = "created"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"
    requested_changes = "requested_changes"
    commented = "commented"


class ReviewHistory(Base):
    __tablename__ = "review_history"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("pipeline_segments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(SQLEnum(ReviewAction), nullable=False)
    previous_status = Column(SQLEnum("planned", "draft", "pending_verification", "pending_review", "approved", "rejected", "needs_additional_evidence", name="pipeline_status_enum"), nullable=True)
    new_status = Column(SQLEnum("planned", "draft", "pending_verification", "pending_review", "approved", "rejected", "needs_additional_evidence", name="pipeline_status_enum"), nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    segment = relationship("PipelineSegment", back_populates="review_history")
    reviewer = relationship("User", back_populates="review_history")

    __table_args__ = (
        Index("ix_review_history_segment_id", "segment_id"),
        Index("ix_review_history_user_id", "user_id"),
    )