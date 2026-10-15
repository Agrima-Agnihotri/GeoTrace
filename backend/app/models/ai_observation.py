from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Float, Index, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class AIObservation(Base):
    __tablename__ = "ai_observations"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("pipeline_segments.id", ondelete="CASCADE"), nullable=False)
    frame_id = Column(Integer, ForeignKey("extracted_frames.id", ondelete="SET NULL"), nullable=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(100), nullable=False)
    detection_type = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    bounding_box = Column(JSON, nullable=True)
    geometry = Column(Text, nullable=True)  # GeoJSON as text
    geometry_crs = Column(String(100), nullable=True)
    is_manual = Column(Boolean, default=False, nullable=False)
    reviewed = Column(Boolean, default=False, nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    segment = relationship("PipelineSegment", back_populates="ai_observations")
    frame = relationship("ExtractedFrame", backref="ai_observations")

    __table_args__ = (
        Index("ix_ai_observations_segment_id", "segment_id"),
        Index("ix_ai_observations_frame_id", "frame_id"),
    )