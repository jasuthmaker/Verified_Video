"""
Tests for authentication endpoints.
Run with: pytest tests/test_auth.py -v
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ── Signup ─────────────────────────────────────────────────────────────────

def test_signup_success():
    resp = client.post("/api/auth/signup", json={
        "email": "test_new@example.com",
        "password": "SecurePass1",
        "role": "teacher",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test_new@example.com"
    assert data["role"] == "teacher"
    assert "id" in data

def test_signup_duplicate_email():
    payload = {"email": "dupe@example.com", "password": "SecurePass1", "role": "teacher"}
    client.post("/api/auth/signup", json=payload)
    resp = client.post("/api/auth/signup", json=payload)
    assert resp.status_code == 400

def test_signup_short_password():
    resp = client.post("/api/auth/signup", json={
        "email": "short@example.com", "password": "abc", "role": "teacher"
    })
    assert resp.status_code == 422  # Pydantic validation error

def test_signup_invalid_role():
    resp = client.post("/api/auth/signup", json={
        "email": "badrole@example.com", "password": "SecurePass1", "role": "admin"
    })
    assert resp.status_code == 422

def test_signup_invalid_email():
    resp = client.post("/api/auth/signup", json={
        "email": "not-an-email", "password": "SecurePass1", "role": "teacher"
    })
    assert resp.status_code == 422

# ── Login ──────────────────────────────────────────────────────────────────

def test_login_success():
    client.post("/api/auth/signup", json={
        "email": "logintest@example.com", "password": "SecurePass1", "role": "student"
    })
    resp = client.post("/api/auth/login", json={
        "email": "logintest@example.com", "password": "SecurePass1"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "student"
    # JWT should be a real token (3 dot-separated parts)
    assert data["access_token"].count(".") == 2

def test_login_wrong_password():
    client.post("/api/auth/signup", json={
        "email": "wrongpw@example.com", "password": "SecurePass1", "role": "teacher"
    })
    resp = client.post("/api/auth/login", json={
        "email": "wrongpw@example.com", "password": "WrongPassword"
    })
    assert resp.status_code == 401

def test_login_unknown_email():
    resp = client.post("/api/auth/login", json={
        "email": "nobody@example.com", "password": "SecurePass1"
    })
    assert resp.status_code == 401

# ── Security headers ───────────────────────────────────────────────────────

def test_security_headers():
    resp = client.get("/health")
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("X-XSS-Protection") == "1; mode=block"

# ── Health check ──────────────────────────────────────────────────────────

def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
