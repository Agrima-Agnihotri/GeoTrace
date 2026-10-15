from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Float, Index, LargeBinary, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.session import Base


class EvidenceType(str, enum.Enum):
    video = "video"
    image = "image"
    document = "document"


class EvidenceRecord(Base):
    __tablename__ = "evidence_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    segment_id = Column(Integer, ForeignKey("pipeline_segments.id", ondelete="SET NULL"), nullable=True)
    capture_session_id = Column(String(100), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    evidence_type = Column(SQLEnum(EvidenceType), nullable=False)
    sha256_hash = Column(String(64), nullable=False, index=True)
    duration_seconds = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    device_timestamp = Column(DateTime(timezone=True), nullable=True)
    server_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    gnss_latitude = Column(Float, nullable=True)
    gnss_longitude = Column(Float, nullable=True)
    gnss_accuracy_m = Column(Float, nullable=True)
    gnss_altitude_m = Column(Float, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("Project", back_populates="evidence")
    segment = relationship("PipelineSegment", back_populates="evidence")
    frames = relationship("ExtractedFrame", back_populates="evidence", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_evidence_records_project_id", "project_id"),
        Index("ix_evidence_records_segment_id", "segment_id"),
    )


class ExtractedFrame(Base):
    __tablename__ = "extracted_frames"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence_records.id", ondelete="CASCADE"), nullable=False)
    frame_number = Column(Integer, nullable=False)
    timestamp_seconds = Column(Float, nullable=False)
    file_path = Column(String(500), nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    gnss_latitude = Column(Float, nullable=True)
    gnss_longitude = Column(Float, nullable=True)
    gnss_accuracy_m = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    evidence = relationship("EvidenceRecord", back_populates="frames")

    __table_args__ = (
        Index("ix_extracted_frames_evidence_id", "evidence_id"),
    )