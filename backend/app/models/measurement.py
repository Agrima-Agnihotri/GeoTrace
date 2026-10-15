from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Float, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.session import Base


class MeasurementMethod(str, enum.Enum):
    gps = "gps"
    total_station = "total_station"
    tape = "tape"
    lidar = "lidar"
    photogrammetry = "photogrammetry"
    unknown = "unknown"


class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("pipeline_segments.id", ondelete="CASCADE"), nullable=False)
    measurement_type = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    reference_surface = Column(String(100), nullable=True)
    datum = Column(String(100), nullable=True)
    method = Column(SQLEnum(MeasurementMethod), nullable=False)
    accuracy = Column(Float, nullable=True)
    source = Column(String(255), nullable=True)
    measured_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    segment = relationship("PipelineSegment", back_populates="measurements")

    __table_args__ = (
        Index("ix_measurements_segment_id", "segment_id"),
    )