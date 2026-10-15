from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class RouteComparison(Base):
    __tablename__ = "route_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("pipeline_segments.id", ondelete="CASCADE"), nullable=False)
    deviation_max_m = Column(Float, nullable=True)
    deviation_mean_m = Column(Float, nullable=True)
    deviation_rms_m = Column(Float, nullable=True)
    length_planned_m = Column(Float, nullable=True)
    length_measured_m = Column(Float, nullable=True)
    length_difference_m = Column(Float, nullable=True)
    tolerance_m = Column(Float, default=0.5, nullable=False)
    status = Column(String(50), nullable=False)
    warnings = Column(JSON, nullable=True)
    compared_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    segment = relationship("PipelineSegment", back_populates="route_comparisons")

    __table_args__ = (
        Index("ix_route_comparisons_segment_id", "segment_id"),
    )