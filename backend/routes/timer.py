from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import ActiveTimer, TimeEntry, User, Task
from backend.dependencies import get_current_active_user
from backend.utils.permissions import verify_task_access
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/timer", tags=["timer"])

class TimerResponse(BaseModel):
    id: str
    taskId: str
    startTime: datetime
    createdAt: datetime
    
    class Config:
        from_attributes = True

class TimeEntryCreate(BaseModel):
    taskId: str
    startTime: datetime
    endTime: datetime | None = None
    duration: int
    description: str | None = None

class TimeEntryResponse(BaseModel):
    id: str
    taskId: str
    startTime: datetime
    endTime: datetime | None
    duration: int
    description: str | None
    createdAt: datetime
    
    class Config:
        from_attributes = True

@router.get("/active", response_model=TimerResponse | None)
async def get_active_timer(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get user's workspaces
    from backend.utils.permissions import get_user_workspace_ids, get_user_space_ids
    from backend.models import Project
    user_workspaces = get_user_workspace_ids(current_user.id, db)
    user_spaces = get_user_space_ids(current_user.id, db)
    
    # Get active timer for user's tasks via project workspace
    active_timer = db.query(ActiveTimer).join(Task).join(Project).filter(
        (Project.workspace_id.in_(user_workspaces)) | (Project.space_id.in_(user_spaces))
    ).first()
    
    return active_timer

@router.post("/start/{task_id}", response_model=TimerResponse)
async def start_timer(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_task_access(task_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if timer already running
    existing = db.query(ActiveTimer).filter(ActiveTimer.task_id == task_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Timer already running for this task")
    
    new_timer = ActiveTimer(
        task_id=task_id,
        start_time=datetime.utcnow()
    )
    db.add(new_timer)
    db.commit()
    db.refresh(new_timer)
    
    return new_timer

@router.post("/stop/{task_id}")
async def stop_timer(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_task_access(task_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    timer = db.query(ActiveTimer).filter(ActiveTimer.task_id == task_id).first()
    if not timer:
        raise HTTPException(status_code=404, detail="No active timer found")
    
    end_time = datetime.utcnow()
    duration = int((end_time - timer.start_time).total_seconds())
    
    # Create time entry
    time_entry = TimeEntry(
        task_id=task_id,
        start_time=timer.start_time,
        end_time=end_time,
        duration=duration
    )
    db.add(time_entry)
    
    # Delete active timer
    db.delete(timer)
    db.commit()
    
    return {"message": "Timer stopped", "duration": duration}

@router.get("/entries/{task_id}", response_model=List[TimeEntryResponse])
async def get_task_time_entries(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_task_access(task_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    entries = db.query(TimeEntry).filter(TimeEntry.task_id == task_id).all()
    return entries

@router.post("/entries", response_model=TimeEntryResponse)
async def create_time_entry(
    entry: TimeEntryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_task_access(entry.taskId, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    new_entry = TimeEntry(
        task_id=entry.taskId,
        start_time=entry.startTime,
        end_time=entry.endTime,
        duration=entry.duration,
        description=entry.description
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    return new_entry
