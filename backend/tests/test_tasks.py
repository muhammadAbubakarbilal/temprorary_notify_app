import pytest
from datetime import datetime

def test_create_task(client, auth_headers, test_user, db_session):
    """Test task creation"""
    from backend.models import Space, Project
    
    # Create space and project
    space = Space(owner_id=test_user.id, type="personal")
    db_session.add(space)
    db_session.commit()
    
    project = Project(name="Test Project", space_id=space.id, status="active")
    db_session.add(project)
    db_session.commit()
    
    response = client.post(
        f"/api/projects/{project.id}/tasks",
        headers=auth_headers,
        json={
            "title": "Test Task",
            "description": "A test task",
            "status": "todo",
            "priority": "high"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["priority"] == "high"

def test_get_project_tasks(client, auth_headers, test_user, db_session):
    """Test getting tasks for a project"""
    from backend.models import Space, Project, Task
    
    space = Space(owner_id=test_user.id, type="personal")
    db_session.add(space)
    db_session.commit()
    
    project = Project(name="Test Project", space_id=space.id, status="active")
    db_session.add(project)
    db_session.commit()
    
    task = Task(
        project_id=project.id,
        title="Test Task",
        status="todo",
        priority="medium"
    )
    db_session.add(task)
    db_session.commit()
    
    response = client.get(
        f"/api/projects/{project.id}/tasks",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["title"] == "Test Task"

def test_update_task(client, auth_headers, test_user, db_session):
    """Test updating a task"""
    from backend.models import Space, Project, Task
    
    space = Space(owner_id=test_user.id, type="personal")
    db_session.add(space)
    db_session.commit()
    
    project = Project(name="Test Project", space_id=space.id, status="active")
    db_session.add(project)
    db_session.commit()
    
    task = Task(
        project_id=project.id,
        title="Original Title",
        status="todo",
        priority="medium"
    )
    db_session.add(task)
    db_session.commit()
    
    response = client.put(
        f"/api/tasks/{task.id}",
        headers=auth_headers,
        json={"title": "Updated Title", "status": "in_progress"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["status"] == "in_progress"

def test_delete_task(client, auth_headers, test_user, db_session):
    """Test deleting a task"""
    from backend.models import Space, Project, Task
    
    space = Space(owner_id=test_user.id, type="personal")
    db_session.add(space)
    db_session.commit()
    
    project = Project(name="Test Project", space_id=space.id, status="active")
    db_session.add(project)
    db_session.commit()
    
    task = Task(
        project_id=project.id,
        title="To Delete",
        status="todo",
        priority="low"
    )
    db_session.add(task)
    db_session.commit()
    
    response = client.delete(
        f"/api/tasks/{task.id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Verify task is deleted
    from backend.models import Task
    deleted_task = db_session.query(Task).filter(Task.id == task.id).first()
    assert deleted_task is None
