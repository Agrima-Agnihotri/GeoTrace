from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Float, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.session import Base


class UtilityType(str, enum.Enum):
    water = "water"
    gas = "gas"
    sewage = "sewage"
    electrical = "electrical"
    telecom = "telecom"


class PipelineStatus(str, enum.Enum):
    planned = "planned"
    draft = "draft"
    pending_verification = "pending_verification"
    pending_review = "pending_review"
    approved = "approved"
    rejected = "rejected"
    needs_additional_evidence = "needs_additional_evidence"


class PipelineAsset(Base):
    __tablename__ = "pipeline_assets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    utility_type = Column(SQLEnum(UtilityType), nullable=False)
    material = Column(String(100), nullable=True)
    diameter_mm = Column(Integer, nullable=True)
    installation_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(SQLEnum(PipelineStatus), default=PipelineStatus.planned, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("Project", back_populates="assets")
    segments = relationship("PipelineSegment", back_populates="asset", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_pipeline_assets_project_id", "project_id"),
    )


class PipelineSegment(Base):
    __tablename__ = "pipeline_segments"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("pipeline_assets.id", ondelete="CASCADE"), nullable=False)
    segment_type = Column(String(50), default="pipe", nullable=False)
    geometry_planned = Column(Text, nullable=True)  # GeoJSON LineString as text
    geometry_draft = Column(Text, nullable=True)
    geometry_approved = Column(Text, nullable=True)
    geometry_crs = Column(String(100), default="EPSG:4326", nullable=False)
    length_m = Column(Float, nullable=True)
    depth_m = Column(Float, nullable=True)
    depth_reference = Column(String(100), nullable=True)
    depth_method = Column(String(50), nullable=True)
    depth_confidence = Column(Float, nullable=True)
    accuracy_m = Column(Float, nullable=True)
    source = Column(String(255), nullable=True)
    version = Column(Integer, default=1, nullable=False)
    status = Column(SQLEnum(PipelineStatus), default=PipelineStatus.planned, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    asset = relationship("PipelineAsset", back_populates="segments")
    evidence = relationship("EvidenceRecord", back_populates="segment", cascade="all, delete-orphan")
    measurements = relationship("Measurement", back_populates="segment", cascade="all, delete-orphan")
    ai_observations = relationship("AIObservation", back_populates="segment", cascade="all, delete-orphan")
    route_comparisons = relationship("RouteComparison", back_populates="segment", cascade="all, delete-orphan")
    review_history = relationship("ReviewHistory", back_populates="segment", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_pipeline_segments_asset_id", "asset_id"),
    )