from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from backend.database import get_db
from backend.models import Task, TimeEntry, Project, User
from backend.dependencies import get_current_active_user
from backend.utils.permissions import get_user_workspace_ids, get_user_space_ids, verify_project_access
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/reports", tags=["reports"])

class TaskStats(BaseModel):
    total: int
    completed: int
    inProgress: int
    todo: int
    byPriority: Dict[str, int]

class TimeStats(BaseModel):
    totalMinutes: int
    entriesCount: int
    byDay: List[Dict[str, Any]]

@router.get("/tasks/stats")
async def get_task_stats(
    project_id: str | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_workspaces = get_user_workspace_ids(current_user.id, db)
    user_spaces = get_user_space_ids(current_user.id, db)
    
    query = db.query(Task).join(Project).filter(
        (Project.workspace_id.in_(user_workspaces)) | (Project.space_id.in_(user_spaces))
    )
    
    if project_id:
        if not verify_project_access(project_id, current_user.id, db):
            raise HTTPException(status_code=403, detail="Access denied")
        query = query.filter(Task.project_id == project_id)
    
    tasks = query.all()
    
    stats = {
        "total": len(tasks),
        "completed": len([t for t in tasks if t.status == 'done']),
        "inProgress": len([t for t in tasks if t.status == 'in_progress']),
        "todo": len([t for t in tasks if t.status == 'todo']),
        "byPriority": {
            "high": len([t for t in tasks if t.priority == 'high']),
            "medium": len([t for t in tasks if t.priority == 'medium']),
            "low": len([t for t in tasks if t.priority == 'low'])
        }
    }
    
    return stats

@router.get("/time/stats")
async def get_time_stats(
    project_id: str | None = None,
    days: int = 7,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_workspaces = get_user_workspace_ids(current_user.id, db)
    user_spaces = get_user_space_ids(current_user.id, db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(TimeEntry).join(Task).join(Project).filter(
        ((Project.workspace_id.in_(user_workspaces)) | (Project.space_id.in_(user_spaces))),
        TimeEntry.start_time >= start_date
    )
    
    if project_id:
        if not verify_project_access(project_id, current_user.id, db):
            raise HTTPException(status_code=403, detail="Access denied")
        query = query.filter(Task.project_id == project_id)
    
    entries = query.all()
    
    total_seconds = sum([e.duration for e in entries])
    total_minutes = total_seconds // 60
    
    # Group by day
    by_day = {}
    for entry in entries:
        day = entry.start_time.date().isoformat()
        if day not in by_day:
            by_day[day] = 0
        by_day[day] += entry.duration // 60
    
    stats = {
        "totalMinutes": total_minutes,
        "entriesCount": len(entries),
        "byDay": [{"date": k, "minutes": v} for k, v in sorted(by_day.items())]
    }
    
    return stats

@router.get("/productivity")
async def get_productivity_report(
    days: int = 30,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_workspaces = get_user_workspace_ids(current_user.id, db)
    user_spaces = get_user_space_ids(current_user.id, db)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Tasks completed
    completed_tasks = db.query(Task).join(Project).filter(
        ((Project.workspace_id.in_(user_workspaces)) | (Project.space_id.in_(user_spaces))),
        Task.status == 'done',
        Task.updated_at >= start_date
    ).count()
    
    # Time tracked
    total_time = db.query(func.sum(TimeEntry.duration)).join(Task).join(Project).filter(
        ((Project.workspace_id.in_(user_workspaces)) | (Project.space_id.in_(user_spaces))),
        TimeEntry.start_time >= start_date
    ).scalar() or 0
    
    # Active projects
    active_projects = db.query(Project).filter(
        ((Project.workspace_id.in_(user_workspaces)) | (Project.space_id.in_(user_spaces))),
        Project.status == 'active'
    ).count()
    
    return {
        "completedTasks": completed_tasks,
        "totalTimeMinutes": total_time // 60,
        "activeProjects": active_projects,
        "period": f"Last {days} days"
    }
