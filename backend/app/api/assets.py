from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models import PipelineAsset, Project, User, PipelineStatus, UtilityType
from app.schemas import PipelineAssetCreate, PipelineAssetUpdate, PipelineAssetResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/projects/{project_id}/assets", tags=["assets"])


def verify_project_access(project_id: int, current_user: User, db: Session) -> Project:
    project = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("", response_model=PipelineAssetResponse, status_code=201)
def create_asset(
    project_id: int,
    asset_in: PipelineAssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_project_access(project_id, current_user, db)
    asset = PipelineAsset(**asset_in.model_dump(), project_id=project_id)
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("", response_model=List[PipelineAssetResponse])
def list_assets(
    project_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[PipelineStatus] = None,
    utility_type: Optional[UtilityType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_project_access(project_id, current_user, db)
    query = db.query(PipelineAsset).filter(PipelineAsset.project_id == project_id)
    if status:
        query = query.filter(PipelineAsset.status == status)
    if utility_type:
        query = query.filter(PipelineAsset.utility_type == utility_type)
    assets = query.offset(skip).limit(limit).all()
    return assets


@router.get("/{asset_id}", response_model=PipelineAssetResponse)
def get_asset(
    project_id: int,
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_project_access(project_id, current_user, db)
    asset = db.query(PipelineAsset).filter(
        PipelineAsset.id == asset_id, PipelineAsset.project_id == project_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.patch("/{asset_id}", response_model=PipelineAssetResponse)
def update_asset(
    project_id: int,
    asset_id: int,
    asset_in: PipelineAssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_project_access(project_id, current_user, db)
    asset = db.query(PipelineAsset).filter(
        PipelineAsset.id == asset_id, PipelineAsset.project_id == project_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = asset_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)

    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=204)
def delete_asset(
    project_id: int,
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_project_access(project_id, current_user, db)
    asset = db.query(PipelineAsset).filter(
        PipelineAsset.id == asset_id, PipelineAsset.project_id == project_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.delete(asset)
    db.commit()
    return None