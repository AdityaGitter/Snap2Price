import uuid
import pytest

def test_login_demo_customer(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@shopsmart.ai", "password": "Demo@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@shopsmart.ai"
    assert data["user"]["role"] == "customer"

def test_login_admin(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@shopsmart.ai", "password": "Admin@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "admin"

def test_register_new_user(client):
    unique_email = f"student_{uuid.uuid4().hex[:8]}@college.edu"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": "CollegePassword123",
            "full_name": "Final Year Student",
            "role": "customer"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == unique_email
    assert "access_token" in data

def test_get_current_user_profile(client):
    # First login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@shopsmart.ai", "password": "Demo@123"}
    )
    token = login_res.json()["access_token"]
    
    # Query /auth/me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "demo@shopsmart.ai"
