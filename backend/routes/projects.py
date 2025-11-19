from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Project, User
from backend.dependencies import get_current_active_user
from backend.utils.permissions import get_user_workspace_ids, get_user_space_ids, verify_project_access
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    color: str = '#6366F1'
    spaceId: str | None = None
    workspaceId: str | None = None
    status: str = 'active'

class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    status: str | None = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None
    color: str
    spaceId: str | None
    workspaceId: str | None
    status: str
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_workspaces = get_user_workspace_ids(current_user.id, db)
    user_spaces = get_user_space_ids(current_user.id, db)
    
    projects = db.query(Project).filter(
        Project.status == 'active',
        (Project.workspace_id.in_(user_workspaces)) | (Project.space_id.in_(user_spaces))
    ).all()
    return projects

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    new_project = Project(
        name=project.name,
        description=project.description,
        color=project.color,
        space_id=project.spaceId,
        workspace_id=project.workspaceId,
        status=project.status
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_project_access(project_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str, 
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_project_access(project_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_update.name is not None:
        project.name = project_update.name
    if project_update.description is not None:
        project.description = project_update.description
    if project_update.color is not None:
        project.color = project_update.color
    if project_update.status is not None:
        project.status = project_update.status
    
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_project_access(project_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.status = 'deleted'
    db.commit()
    return {"message": "Project deleted successfully"}
