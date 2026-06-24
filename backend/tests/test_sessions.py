"""
Tests for session endpoints.
Run with: pytest tests/test_sessions.py -v
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_session_success():
    resp = client.post("/api/sessions/", json={
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "Test Lesson",
        "description": "A test session"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Test Lesson"
    assert "session_key" in data
    assert "share_url" in data

def test_create_session_no_title():
    resp = client.post("/api/sessions/", json={
        "video_url": "https://www.youtube.com/watch?v=abc"
    })
    assert resp.status_code == 400

def test_create_session_invalid_url():
    resp = client.post("/api/sessions/", json={
        "video_url": "not-a-url",
        "title": "Bad URL Session"
    })
    assert resp.status_code == 422

def test_create_session_title_too_long():
    resp = client.post("/api/sessions/", json={
        "video_url": "https://www.youtube.com/watch?v=abc",
        "title": "A" * 201
    })
    assert resp.status_code == 422

def test_list_sessions():
    resp = client.get("/api/sessions/")
    assert resp.status_code == 200
    assert "sessions" in resp.json()

def test_session_not_found():
    resp = client.get("/api/sessions/nonexistent-id")
    assert resp.status_code == 404
