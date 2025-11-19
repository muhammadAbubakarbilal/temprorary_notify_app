from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Workspace, Membership, User, Space
from backend.dependencies import get_current_active_user
from backend.utils.permissions import get_user_workspace_ids, verify_workspace_access
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

class WorkspaceCreate(BaseModel):
    name: str
    description: str | None = None
    spaceId: str

class WorkspaceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class WorkspaceResponse(BaseModel):
    id: str
    spaceId: str
    name: str
    description: str | None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

class MembershipResponse(BaseModel):
    id: str
    workspaceId: str
    userId: str
    role: str
    createdAt: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[WorkspaceResponse])
async def get_workspaces(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    workspace_ids = get_user_workspace_ids(current_user.id, db)
    workspaces = db.query(Workspace).filter(Workspace.id.in_(workspace_ids)).all()
    return workspaces

@router.post("/", response_model=WorkspaceResponse)
async def create_workspace(
    workspace: WorkspaceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify user owns the space
    space = db.query(Space).filter(
        Space.id == workspace.spaceId,
        Space.owner_id == current_user.id
    ).first()
    
    if not space:
        raise HTTPException(status_code=403, detail="Access denied to space")
    
    new_workspace = Workspace(
        space_id=workspace.spaceId,
        name=workspace.name,
        description=workspace.description
    )
    db.add(new_workspace)
    db.flush()
    
    # Create membership for creator
    membership = Membership(
        workspace_id=new_workspace.id,
        user_id=current_user.id,
        role='admin'
    )
    db.add(membership)
    db.commit()
    db.refresh(new_workspace)
    
    return new_workspace

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_workspace_access(workspace_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    return workspace

@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    workspace_update: WorkspaceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_workspace_access(workspace_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    if workspace_update.name is not None:
        workspace.name = workspace_update.name
    if workspace_update.description is not None:
        workspace.description = workspace_update.description
    
    db.commit()
    db.refresh(workspace)
    return workspace

@router.get("/{workspace_id}/members", response_model=List[MembershipResponse])
async def get_workspace_members(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_workspace_access(workspace_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    members = db.query(Membership).filter(
        Membership.workspace_id == workspace_id
    ).all()
    return members
