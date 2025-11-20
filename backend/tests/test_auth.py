import pytest
from fastapi.testclient import TestClient

def test_register_user(client):
    """Test user registration"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "securepassword",
            "firstName": "New",
            "lastName": "User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data

def test_register_duplicate_email(client, test_user):
    """Test registration with existing email"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": test_user.email,
            "password": "password",
            "firstName": "Test",
            "lastName": "User"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_login_success(client, test_user):
    """Test successful login"""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"

def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_get_current_user(client, auth_headers):
    """Test getting current user"""
    response = client.get("/api/auth/user", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"

def test_logout(client, auth_headers):
    """Test logout"""
    response = client.post("/api/auth/logout", headers=auth_headers)
    assert response.status_code == 200
