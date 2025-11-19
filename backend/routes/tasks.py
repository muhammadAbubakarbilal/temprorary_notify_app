from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Task
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api", tags=["tasks"])

class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    status: str = 'todo'
    priority: str = 'medium'
    assigneeId: str | None = None
    dueDate: datetime | None = None
    noteId: str | None = None
    tags: List[str] = []

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assigneeId: str | None = None
    dueDate: datetime | None = None
    tags: List[str] | None = None

class TaskResponse(BaseModel):
    id: str
    projectId: str
    noteId: str | None
    title: str
    description: str | None
    status: str
    priority: str
    assigneeId: str | None
    dueDate: datetime | None
    tags: List[str]
    seriesId: str | None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
async def get_project_tasks(project_id: str, db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    return tasks

@router.post("/projects/{project_id}/tasks", response_model=TaskResponse)
async def create_task(project_id: str, task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        project_id=project_id,
        note_id=task.noteId,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        assignee_id=task.assigneeId,
        due_date=task.dueDate,
        tags=task.tags
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.status is not None:
        task.status = task_update.status
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.assigneeId is not None:
        task.assignee_id = task_update.assigneeId
    if task_update.dueDate is not None:
        task.due_date = task_update.dueDate
    if task_update.tags is not None:
        task.tags = task_update.tags
    
    db.commit()
    db.refresh(task)
    return task

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
