"""
Tests for MCP resources
"""

import pytest
from unittest.mock import AsyncMock, patch
import json

from src.resources.customers import CustomerResources
from src.resources.requests import RequestResources
from src.resources.appointments import AppointmentResources
from src.resources.dashboard import DashboardResources


class TestCustomerResources:
    """Test customer resources"""
    
    @pytest.mark.asyncio
    async def test_list_resources(self):
        """Test listing customer resources"""
        resources = await CustomerResources.list_resources()
        
        assert len(resources) == 4
        assert any(r.uri == "bms://customers/list" for r in resources)
        assert any(r.uri == "bms://customers/active" for r in resources)
        assert any(r.uri == "bms://customers/stats" for r in resources)
        assert any(r.uri == "bms://customers/recent" for r in resources)
    
    @pytest.mark.asyncio
    async def test_read_customer_list(self, monkeypatch, sample_customer_data):
        """Test reading customer list"""
        # Mock bms_client
        mock_get_customers = AsyncMock(return_value={
            "customers": [sample_customer_data],
            "total": 1
        })
        monkeypatch.setattr("src.resources.customers.bms_client.get_customers", mock_get_customers)
        
        # Test
        result = await CustomerResources.read_resource(
            "bms://customers/list",
            {"limit": 10, "status": "active"}
        )
        
        # Verify
        assert result["type"] == "customer_list"
        assert result["data"]["total"] == 1
        assert result["metadata"]["limit"] == 10
        assert result["metadata"]["status"] == "active"
        
        mock_get_customers.assert_called_once_with(limit=10, offset=0, status="active")
    
    @pytest.mark.asyncio
    async def test_read_active_customers(self, monkeypatch, sample_customer_data):
        """Test reading active customers"""
        # Mock bms_client
        mock_get_customers = AsyncMock(return_value={
            "customers": [sample_customer_data],
            "total": 1
        })
        monkeypatch.setattr("src.resources.customers.bms_client.get_customers", mock_get_customers)
        
        # Test
        result = await CustomerResources.read_resource("bms://customers/active")
        
        # Verify
        assert result["type"] == "active_customers"
        mock_get_customers.assert_called_once_with(limit=100, status="active")
    
    @pytest.mark.asyncio
    async def test_read_customer_by_id(self, monkeypatch, sample_customer_data):
        """Test reading specific customer"""
        # Mock bms_client
        mock_get_customer = AsyncMock(return_value=sample_customer_data)
        monkeypatch.setattr("src.resources.customers.bms_client.get_customer", mock_get_customer)
        
        # Test
        result = await CustomerResources.read_resource("bms://customers/cust_123")
        
        # Verify
        assert result["type"] == "customer_detail"
        assert result["data"]["id"] == "cust_123"
        mock_get_customer.assert_called_once_with("cust_123")
    
    @pytest.mark.asyncio
    async def test_read_unknown_resource(self):
        """Test reading unknown resource"""
        with pytest.raises(ValueError, match="Unknown customer resource"):
            await CustomerResources.read_resource("bms://customers/invalid")


class TestRequestResources:
    """Test request resources"""
    
    @pytest.mark.asyncio
    async def test_list_resources(self):
        """Test listing request resources"""
        resources = await RequestResources.list_resources()
        
        assert len(resources) == 7
        expected_uris = [
            "bms://requests/list",
            "bms://requests/pending",
            "bms://requests/assigned",
            "bms://requests/my-assigned",
            "bms://requests/open",
            "bms://requests/stats",
            "bms://requests/by-status"
        ]
        
        for uri in expected_uris:
            assert any(r.uri == uri for r in resources)
    
    @pytest.mark.asyncio
    async def test_read_pending_requests(self, monkeypatch, sample_request_data):
        """Test reading pending requests"""
        # Mock bms_client
        mock_get_requests = AsyncMock(return_value={
            "requests": [sample_request_data],
            "total": 1
        })
        monkeypatch.setattr("src.resources.requests.bms_client.get_requests", mock_get_requests)
        
        # Test
        result = await RequestResources.read_resource("bms://requests/pending")
        
        # Verify
        assert result["type"] == "pending_requests"
        mock_get_requests.assert_called_once_with(limit=100, assigned=False, status="pending")
    
    @pytest.mark.asyncio
    async def test_read_my_assigned_requests(self, monkeypatch, sample_request_data, sample_user_data):
        """Test reading requests assigned to current user"""
        # Mock auth client
        mock_get_info = AsyncMock(return_value=sample_user_data)
        monkeypatch.setattr("src.resources.requests.auth_client.get_service_account_info", mock_get_info)
        
        # Mock bms_client
        mock_get_requests = AsyncMock(return_value={
            "requests": [sample_request_data],
            "total": 1
        })
        monkeypatch.setattr("src.resources.requests.bms_client.get_requests", mock_get_requests)
        
        # Test
        result = await RequestResources.read_resource("bms://requests/my-assigned")
        
        # Verify
        assert result["type"] == "my_assigned_requests"
        mock_get_requests.assert_called_once_with(limit=100, assigned_to="user_111")
    
    @pytest.mark.asyncio
    async def test_read_open_requests(self, monkeypatch, sample_request_data):
        """Test reading all open requests"""
        # Mock bms_client to return requests for each status
        mock_get_requests = AsyncMock(side_effect=[
            {"requests": [sample_request_data], "total": 1},  # pending
            {"requests": [], "total": 0},  # in_progress
            {"requests": [], "total": 0}   # assigned
        ])
        monkeypatch.setattr("src.resources.requests.bms_client.get_requests", mock_get_requests)
        
        # Test
        result = await RequestResources.read_resource("bms://requests/open")
        
        # Verify
        assert result["type"] == "open_requests"
        assert len(result["data"]["requests"]) == 1
        assert result["data"]["total"] == 1
        assert mock_get_requests.call_count == 3


class TestAppointmentResources:
    """Test appointment resources"""
    
    @pytest.mark.asyncio
    async def test_list_resources(self):
        """Test listing appointment resources"""
        resources = await AppointmentResources.list_resources()
        
        assert len(resources) == 6
        assert any(r.uri == "bms://appointments/upcoming" for r in resources)
        assert any(r.uri == "bms://appointments/today" for r in resources)
        assert any(r.uri == "bms://appointments/calendar" for r in resources)
    
    @pytest.mark.asyncio
    async def test_read_today_appointments(self, monkeypatch, sample_appointment_data, mock_datetime):
        """Test reading today's appointments"""
        # Modify sample to be today
        today_apt = sample_appointment_data.copy()
        today_apt["scheduledAt"] = "2024-01-15T14:00:00Z"  # Same as mock date
        
        # Mock bms_client
        mock_get_appointments = AsyncMock(return_value={
            "appointments": [today_apt],
            "total": 1
        })
        monkeypatch.setattr("src.resources.appointments.bms_client.get_appointments", mock_get_appointments)
        
        # Test
        result = await AppointmentResources.read_resource("bms://appointments/today")
        
        # Verify
        assert result["type"] == "today_appointments"
        assert len(result["data"]["appointments"]) == 1
        assert result["metadata"]["date"] == "2024-01-15"
    
    @pytest.mark.asyncio
    async def test_read_calendar_appointments(self, monkeypatch, sample_appointment_data):
        """Test reading appointments in calendar format"""
        # Mock bms_client
        mock_get_appointments = AsyncMock(return_value={
            "appointments": [sample_appointment_data],
            "total": 1
        })
        monkeypatch.setattr("src.resources.appointments.bms_client.get_appointments", mock_get_appointments)
        
        # Test
        result = await AppointmentResources.read_resource(
            "bms://appointments/calendar",
            {"start_date": "2024-01-15", "end_date": "2024-01-31"}
        )
        
        # Verify
        assert result["type"] == "appointment_calendar"
        assert "2024-01-20" in result["data"]  # Date from sample
        assert len(result["data"]["2024-01-20"]) == 1


class TestDashboardResources:
    """Test dashboard resources"""
    
    @pytest.mark.asyncio
    async def test_list_resources(self):
        """Test listing dashboard resources"""
        resources = await DashboardResources.list_resources()
        
        assert len(resources) == 6
        assert any(r.uri == "bms://dashboard/overview" for r in resources)
        assert any(r.uri == "bms://dashboard/kpis" for r in resources)
        assert any(r.uri == "bms://dashboard/alerts" for r in resources)
    
    @pytest.mark.asyncio
    async def test_read_dashboard_overview(self, monkeypatch):
        """Test reading dashboard overview"""
        # Mock bms_client
        mock_stats = AsyncMock(return_value={
            "customers": {"total": 100, "active": 80},
            "requests": {"total": 50, "pending": 10},
            "appointments": {"total": 30, "upcoming": 5},
            "timestamp": "2024-01-15T10:00:00Z"
        })
        monkeypatch.setattr("src.resources.dashboard.bms_client.get_dashboard_stats", mock_stats)
        
        # Test
        result = await DashboardResources.read_resource("bms://dashboard/overview")
        
        # Verify
        assert result["type"] == "dashboard_overview"
        assert result["data"]["summary"]["total_customers"] == 100
        assert result["data"]["summary"]["pending_requests"] == 10
    
    @pytest.mark.asyncio
    async def test_read_alerts(self, monkeypatch):
        """Test reading business alerts"""
        # Mock bms_client
        mock_stats = AsyncMock(return_value={
            "customers": {"total": 100},
            "requests": {"total": 50, "pending": 25, "completion_rate": 75},
            "appointments": {"total": 30, "upcoming": 10},
            "timestamp": "2024-01-15T10:00:00Z"
        })
        monkeypatch.setattr("src.resources.dashboard.bms_client.get_dashboard_stats", mock_stats)
        
        # Test
        result = await DashboardResources.read_resource("bms://dashboard/alerts")
        
        # Verify
        assert result["type"] == "business_alerts"
        alerts = result["data"]["alerts"]
        
        # Should have alert for high pending requests
        pending_alert = next((a for a in alerts if a["category"] == "requests"), None)
        assert pending_alert is not None
        assert pending_alert["priority"] == "high"  # >20 pending
        
        # Should have alert for low completion rate
        completion_alert = next((a for a in alerts if a["category"] == "performance"), None)
        assert completion_alert is not None