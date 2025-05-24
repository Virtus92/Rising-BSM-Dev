"""
Pytest configuration and fixtures for BMS MCP Server tests
"""

import pytest
import asyncio
from typing import AsyncGenerator, Dict, Any
from unittest.mock import Mock, AsyncMock, patch
import httpx
from datetime import datetime, timedelta
import json
import os

# Add src to path
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import Settings
from src.bms_client import BMSClient
from src.auth import BMSAuthClient
from src.mcp_server import BMSMCPServer


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_settings():
    """Test settings configuration"""
    return Settings(
        bms_api_url="https://test-bms.com/api",
        bms_api_key="test-jwt-token",
        mcp_server_name="test-mcp-server",
        mcp_server_version="1.0.0-test",
        sse_heartbeat_interval=5,
        allowed_origins=["http://localhost:*", "http://test:*"],
        log_level="DEBUG"
    )


@pytest.fixture
def mock_httpx_client():
    """Mock httpx.AsyncClient for API calls"""
    with patch("httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        yield mock_client


@pytest.fixture
def sample_customer_data():
    """Sample customer data for testing"""
    return {
        "id": "cust_123",
        "name": "Test Customer",
        "email": "test@example.com",
        "phone": "+1234567890",
        "company": "Test Corp",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_request_data():
    """Sample request data for testing"""
    return {
        "id": "req_456",
        "customerId": "cust_123",
        "subject": "Test Request",
        "description": "This is a test request",
        "status": "pending",
        "priority": "normal",
        "assignedTo": None,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
    }


@pytest.fixture
def sample_appointment_data():
    """Sample appointment data for testing"""
    return {
        "id": "apt_789",
        "customerId": "cust_123",
        "title": "Test Appointment",
        "description": "Test appointment description",
        "scheduledAt": "2024-01-20T14:00:00Z",
        "duration": 60,
        "status": "scheduled",
        "location": "Office",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
    }


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "id": "user_111",
        "name": "Test User",
        "email": "user@test.com",
        "role": "agent",
        "active": True,
        "permissions": [
            "customers:read",
            "customers:write",
            "requests:read",
            "requests:write",
            "appointments:read",
            "appointments:write"
        ]
    }


@pytest.fixture
def sample_auth_response():
    """Sample authentication response"""
    return {
        "user": {
            "id": "user_111",
            "name": "Test User",
            "email": "user@test.com",
            "role": "agent"
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
        "refreshToken": "refresh_token_123"
    }


@pytest.fixture
def sample_sse_event():
    """Sample SSE event"""
    return {
        "entity_type": "request",
        "event_type": "created",
        "entity_id": "req_456",
        "data": {
            "id": "req_456",
            "subject": "New Request",
            "status": "pending",
            "customerId": "cust_123"
        },
        "timestamp": datetime.utcnow().isoformat(),
        "source": "webhook"
    }


@pytest.fixture
async def mock_bms_client(monkeypatch, test_settings, mock_httpx_client):
    """Mock BMS client with test settings"""
    monkeypatch.setattr("src.bms_client.settings", test_settings)
    client = BMSClient()
    return client


@pytest.fixture
async def mock_auth_client(monkeypatch, test_settings, mock_httpx_client):
    """Mock auth client with test settings"""
    monkeypatch.setattr("src.auth.settings", test_settings)
    client = BMSAuthClient()
    return client


@pytest.fixture
def mock_mcp_resources():
    """Mock MCP resources"""
    return {
        "customers": AsyncMock(),
        "requests": AsyncMock(),
        "appointments": AsyncMock(),
        "dashboard": AsyncMock()
    }


@pytest.fixture
def mock_mcp_tools():
    """Mock MCP tools"""
    return {
        "customer_tools": AsyncMock(),
        "request_tools": AsyncMock(),
        "appointment_tools": AsyncMock(),
        "automation_tools": AsyncMock(),
        "auth_tools": AsyncMock()
    }


@pytest.fixture
async def test_client(test_settings):
    """Test client for SSE server"""
    from httpx import AsyncClient
    from src.sse_server import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_active_connections():
    """Mock for active SSE connections"""
    return set()


@pytest.fixture
def auth_headers():
    """Common authorization headers for testing"""
    return {"Authorization": "Bearer test-jwt-token"}


@pytest.fixture
def mock_datetime(monkeypatch):
    """Mock datetime for consistent testing"""
    mock_dt = datetime(2024, 1, 15, 10, 0, 0)
    
    class MockDateTime:
        @classmethod
        def utcnow(cls):
            return mock_dt
        
        @classmethod
        def fromisoformat(cls, date_string):
            return datetime.fromisoformat(date_string)
    
    monkeypatch.setattr("src.bms_client.datetime", MockDateTime)
    monkeypatch.setattr("src.sse_server.datetime", MockDateTime)
    return mock_dt