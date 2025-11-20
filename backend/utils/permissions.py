from sqlalchemy.orm import Session
from backend.models import Project, Task, Note, Workspace, Membership, Space

def get_user_workspace_ids(user_id: str, db: Session) -> list[str]:
    """Get all workspace IDs the user has access to"""
    memberships = db.query(Membership).filter(Membership.user_id == user_id).all()
    return [m.workspace_id for m in memberships]

def get_user_space_ids(user_id: str, db: Session) -> list[str]:
    """Get all space IDs the user owns"""
    spaces = db.query(Space).filter(Space.owner_id == user_id).all()
    return [s.id for s in spaces]

def verify_project_access(project_id: str, user_id: str, db: Session) -> bool:
    """Verify if user has access to a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False
    
    user_workspaces = get_user_workspace_ids(user_id, db)
    user_spaces = get_user_space_ids(user_id, db)
    
    return (
        project.workspace_id in user_workspaces or
        project.space_id in user_spaces
    )

def verify_task_access(task_id: str, user_id: str, db: Session) -> bool:
    """Verify if user has access to a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return False
    
    return verify_project_access(task.project_id, user_id, db)

def verify_note_access(note_id: str, user_id: str, db: Session) -> bool:
    """Verify if user has access to a note"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        return False
    
    # Check if user is the author
    if note.author_id == user_id:
        return True
    
    # Check workspace/space access
    user_workspaces = get_user_workspace_ids(user_id, db)
    user_spaces = get_user_space_ids(user_id, db)
    
    # Check visibility scope
    if note.visibility_scope == 'private':
        return note.author_id == user_id
    elif note.visibility_scope == 'workspace':
        return note.workspace_id in user_workspaces
    elif note.visibility_scope == 'space':
        return note.space_id in user_spaces
    
    return False

def verify_workspace_access(workspace_id: str, user_id: str, db: Session) -> bool:
    """Verify if user has access to a workspace"""
    membership = db.query(Membership).filter(
        Membership.workspace_id == workspace_id,
        Membership.user_id == user_id
    ).first()
    return membership is not None

def get_user_role_in_workspace(workspace_id: str, user_id: str, db: Session) -> str | None:
    """Get user's role in a workspace"""
    membership = db.query(Membership).filter(
        Membership.workspace_id == workspace_id,
        Membership.user_id == user_id
    ).first()
    return membership.role if membership else None
