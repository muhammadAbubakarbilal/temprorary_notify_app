import pytest

def test_create_project(client, auth_headers, test_user, db_session):
    """Test project creation"""
    from backend.models import Space
    
    # Create a space for the user
    space = Space(owner_id=test_user.id, type="personal")
    db_session.add(space)
    db_session.commit()
    
    response = client.post(
        "/api/projects/",
        headers=auth_headers,
        json={
            "name": "Test Project",
            "description": "A test project",
            "color": "#FF5733",
            "spaceId": space.id,
            "status": "active"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["color"] == "#FF5733"

def test_get_projects(client, auth_headers, test_user, db_session):
    """Test getting user's projects"""
    from backend.models import Space, Project
    
    # Create space and project
    space = Space(owner_id=test_user.id, type="personal")
    db_session.add(space)
    db_session.commit()
    
    project = Project(
        name="Test Project",
        space_id=space.id,
        status="active"
    )
    db_session.add(project)
    db_session.commit()
    
    response = client.get("/api/projects/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["name"] == "Test Project"

def test_update_project(client, auth_headers, test_user, db_session):
    """Test updating a project"""
    from backend.models import Space, Project
    
    space = Space(owner_id=test_user.id, type="personal")
    db_session.add(space)
    db_session.commit()
    
    project = Project(
        name="Original Name",
        space_id=space.id,
        status="active"
    )
    db_session.add(project)
    db_session.commit()
    
    response = client.put(
        f"/api/projects/{project.id}",
        headers=auth_headers,
        json={"name": "Updated Name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"

def test_delete_project(client, auth_headers, test_user, db_session):
    """Test deleting a project"""
    from backend.models import Space, Project
    
    space = Space(owner_id=test_user.id, type="personal")
    db_session.add(space)
    db_session.commit()
    
    project = Project(
        name="To Delete",
        space_id=space.id,
        status="active"
    )
    db_session.add(project)
    db_session.commit()
    
    response = client.delete(
        f"/api/projects/{project.id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Verify project is marked as deleted
    db_session.refresh(project)
    assert project.status == "deleted"
