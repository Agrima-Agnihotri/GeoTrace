from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.session import Base


class ProjectStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    archived = "archived"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.active, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    crs = Column(String(100), default="EPSG:4326", nullable=False)
    site_boundary = Column(Text, nullable=True)  # GeoJSON as text
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    owner = relationship("User", back_populates="owned_projects")
    assets = relationship("PipelineAsset", back_populates="project", cascade="all, delete-orphan")
    evidence = relationship("EvidenceRecord", back_populates="project", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_projects_owner_id", "owner_id"),
    )