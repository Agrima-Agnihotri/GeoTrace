from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models import PipelineSegment, PipelineAsset, Project, User, PipelineStatus
from app.schemas import PipelineSegmentCreate, PipelineSegmentUpdate, PipelineSegmentResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/assets/{asset_id}/segments", tags=["segments"])


def verify_asset_access(asset_id: int, current_user: User, db: Session) -> PipelineAsset:
    asset = db.query(PipelineAsset).join(Project).filter(
        PipelineAsset.id == asset_id,
        Project.owner_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.post("", response_model=PipelineSegmentResponse, status_code=201)
def create_segment(
    asset_id: int,
    segment_in: PipelineSegmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_asset_access(asset_id, current_user, db)
    segment = PipelineSegment(**segment_in.model_dump(), asset_id=asset_id)
    db.add(segment)
    db.commit()
    db.refresh(segment)
    return segment


@router.get("", response_model=List[PipelineSegmentResponse])
def list_segments(
    asset_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[PipelineStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_asset_access(asset_id, current_user, db)
    query = db.query(PipelineSegment).filter(PipelineSegment.asset_id == asset_id)
    if status:
        query = query.filter(PipelineSegment.status == status)
    segments = query.offset(skip).limit(limit).all()
    return segments


@router.get("/{segment_id}", response_model=PipelineSegmentResponse)
def get_segment(
    asset_id: int,
    segment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_asset_access(asset_id, current_user, db)
    segment = db.query(PipelineSegment).filter(
        PipelineSegment.id == segment_id, PipelineSegment.asset_id == asset_id
    ).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    return segment


@router.patch("/{segment_id}", response_model=PipelineSegmentResponse)
def update_segment(
    asset_id: int,
    segment_id: int,
    segment_in: PipelineSegmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_asset_access(asset_id, current_user, db)
    segment = db.query(PipelineSegment).filter(
        PipelineSegment.id == segment_id, PipelineSegment.asset_id == asset_id
    ).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    update_data = segment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(segment, field, value)

    db.commit()
    db.refresh(segment)
    return segment


@router.delete("/{segment_id}", status_code=204)
def delete_segment(
    asset_id: int,
    segment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_asset_access(asset_id, current_user, db)
    segment = db.query(PipelineSegment).filter(
        PipelineSegment.id == segment_id, PipelineSegment.asset_id == asset_id
    ).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    db.delete(segment)
    db.commit()
    return None