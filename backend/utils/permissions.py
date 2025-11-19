from sqlalchemy.orm import Session
from typing import List
from backend.models import Membership, Project, Note, Task, Workspace, Space

def get_user_workspace_ids(user_id: str, db: Session) -> List[str]:
    """Get all workspace IDs the user has access to"""
    memberships = db.query(Membership).filter(
        Membership.user_id == user_id
    ).all()
    return [m.workspace_id for m in memberships]

def get_user_space_ids(user_id: str, db: Session) -> List[str]:
    """Get all space IDs the user owns"""
    from backend.models import Space
    spaces = db.query(Space).filter(Space.owner_id == user_id).all()
    return [s.id for s in spaces]

def verify_project_access(project_id: str, user_id: str, db: Session) -> bool:
    """Verify user has access to a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False
    
    user_workspaces = get_user_workspace_ids(user_id, db)
    user_spaces = get_user_space_ids(user_id, db)
    
    return (project.workspace_id in user_workspaces or 
            project.space_id in user_spaces)

def verify_note_access(note_id: str, user_id: str, db: Session) -> bool:
    """Verify user has access to a note"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        return False
    
    # User is author
    if note.author_id == user_id:
        return True
    
    # Check workspace/space access
    user_workspaces = get_user_workspace_ids(user_id, db)
    user_spaces = get_user_space_ids(user_id, db)
    
    # Check workspace access (if workspace_id is set)
    if note.workspace_id and note.workspace_id in user_workspaces:
        return True
    
    # Check space access (if space_id is set)
    if note.space_id and note.space_id in user_spaces:
        return True
    
    # Check project access (if project_id is set)
    if note.project_id:
        return verify_project_access(note.project_id, user_id, db)
    
    return False

def verify_task_access(task_id: str, user_id: str, db: Session) -> bool:
    """Verify user has access to a task"""
    task = db.query(Task).join(Project).filter(Task.id == task_id).first()
    if not task:
        return False
    
    # Check project access via join
    return verify_project_access(task.project_id, user_id, db)

def verify_workspace_access(workspace_id: str, user_id: str, db: Session) -> bool:
    """Verify user is a member of a workspace"""
    membership = db.query(Membership).filter(
        Membership.workspace_id == workspace_id,
        Membership.user_id == user_id
    ).first()
    return membership is not None
