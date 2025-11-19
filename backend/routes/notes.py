from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Note
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api", tags=["notes"])

class NoteCreate(BaseModel):
    title: str
    content: str = ''
    spaceId: str | None = None
    workspaceId: str | None = None
    authorId: str | None = None
    tags: List[str] = []
    backlinks: List[str] = []
    visibilityScope: str = 'private'

class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    tags: List[str] | None = None
    backlinks: List[str] | None = None
    visibilityScope: str | None = None

class NoteResponse(BaseModel):
    id: str
    spaceId: str | None
    workspaceId: str | None
    projectId: str | None
    authorId: str | None
    title: str
    content: str
    tags: List[str]
    backlinks: List[str]
    visibilityScope: str
    lastProcessedLength: int
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

@router.get("/projects/{project_id}/notes", response_model=List[NoteResponse])
async def get_project_notes(project_id: str, db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.project_id == project_id).all()
    return notes

@router.post("/projects/{project_id}/notes", response_model=NoteResponse)
async def create_note(project_id: str, note: NoteCreate, db: Session = Depends(get_db)):
    new_note = Note(
        project_id=project_id,
        space_id=note.spaceId,
        workspace_id=note.workspaceId,
        author_id=note.authorId,
        title=note.title,
        content=note.content,
        tags=note.tags,
        backlinks=note.backlinks,
        visibility_scope=note.visibilityScope
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(note_id: str, note_update: NoteUpdate, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note_update.title is not None:
        note.title = note_update.title
    if note_update.content is not None:
        note.content = note_update.content
    if note_update.tags is not None:
        note.tags = note_update.tags
    if note_update.backlinks is not None:
        note.backlinks = note_update.backlinks
    if note_update.visibilityScope is not None:
        note.visibility_scope = note_update.visibilityScope
    
    db.commit()
    db.refresh(note)
    return note

@router.delete("/notes/{note_id}")
async def delete_note(note_id: str, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}
