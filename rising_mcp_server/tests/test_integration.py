"""
Integration tests for MCP server
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, Mock, patch
from datetime import datetime, timedelta

from src.bms_client import BMSClient
from src.mcp_server import BMSMCPServer
from src.resources.customers import CustomerResources
from src.tools.request_tools import RequestTools


class TestEndToEndWorkflows:
    """Test complete workflows through the MCP server"""
    
    @pytest.mark.asyncio
    async def test_customer_creation_workflow(self, monkeypatch):
        """Test complete customer creation workflow"""
        # Mock data
        created_customer = {
            "id": "cust_new_123",
            "name": "New Customer",
            "email": "new@example.com",
            "status": "active",
            "createdAt": datetime.utcnow().isoformat()
        }
        
        # Mock BMS client
        mock_create = AsyncMock(return_value=created_customer)
        mock_add_note = AsyncMock(return_value={"success": True})
        mock_get = AsyncMock(return_value=created_customer)
        
        monkeypatch.setattr("src.tools.customer_tools.bms_client.create_customer", mock_create)
        monkeypatch.setattr("src.tools.customer_tools.bms_client.add_customer_note", mock_add_note)
        monkeypatch.setattr("src.resources.customers.bms_client.get_customer", mock_get)
        
        # Step 1: Create customer via tool
        create_result = await CustomerTools.execute_tool(
            "customer_create",
            {
                "name": "New Customer",
                "email": "new@example.com",
                "notes": "VIP customer"
            }
        )
        
        assert "Successfully created customer" in create_result[0].text
        assert "cust_new_123" in create_result[0].text
        
        # Step 2: Read customer via resource
        read_result = await CustomerResources.read_resource("bms://customers/cust_new_123")
        
        assert read_result["type"] == "customer_detail"
        assert read_result["data"]["id"] == "cust_new_123"
        assert read_result["data"]["email"] == "new@example.com"
    
    @pytest.mark.asyncio
    async def test_request_assignment_workflow(self, monkeypatch):
        """Test request creation and assignment workflow"""
        # Mock data
        pending_request = {
            "id": "req_new_123",
            "customerId": "cust_123",
            "subject": "Urgent Request",
            "status": "pending",
            "assignedTo": None
        }
        
        assigned_request = {
            **pending_request,
            "status": "assigned",
            "assignedTo": "user_456"
        }
        
        users = {
            "users": [
                {"id": "user_456", "name": "Agent Smith", "active": True}
            ]
        }
        
        # Mock BMS client
        mock_create = AsyncMock(return_value=pending_request)
        mock_get_users = AsyncMock(return_value=users)
        mock_assign = AsyncMock(return_value={"success": True})
        mock_get_requests = AsyncMock(side_effect=[
            {"requests": [pending_request], "total": 1},  # First call - pending
            {"requests": [assigned_request], "total": 1}  # Second call - assigned
        ])
        
        monkeypatch.setattr("src.tools.request_tools.bms_client.create_request", mock_create)
        monkeypatch.setattr("src.resources.dashboard.bms_client.get_users", mock_get_users)
        monkeypatch.setattr("src.tools.request_tools.bms_client.assign_request", mock_assign)
        monkeypatch.setattr("src.resources.requests.bms_client.get_requests", mock_get_requests)
        
        # Step 1: Create request
        create_result = await RequestTools.execute_tool(
            "request_create",
            {
                "customer_id": "cust_123",
                "subject": "Urgent Request",
                "description": "Customer needs immediate assistance",
                "priority": "high"
            }
        )
        
        assert "Successfully created request" in create_result[0].text
        
        # Step 2: Get pending requests
        from src.resources.requests import RequestResources
        pending_result = await RequestResources.read_resource("bms://requests/pending")
        
        assert pending_result["data"]["total"] == 1
        assert pending_result["data"]["requests"][0]["id"] == "req_new_123"
        
        # Step 3: Get available users
        from src.resources.dashboard import DashboardResources
        users_result = await DashboardResources.read_resource("bms://users/active")
        
        assert len(users_result["data"]["users"]) == 1
        assert users_result["data"]["users"][0]["id"] == "user_456"
        
        # Step 4: Assign request
        assign_result = await RequestTools.execute_tool(
            "request_assign",
            {
                "request_id": "req_new_123",
                "user_id": "user_456",
                "note": "Assigned to best available agent"
            }
        )
        
        assert "Successfully assigned request" in assign_result[0].text
        
        # Step 5: Verify assignment
        assigned_result = await RequestResources.read_resource("bms://requests/assigned")
        
        assert assigned_result["data"]["requests"][0]["assignedTo"] == "user_456"
    
    @pytest.mark.asyncio
    async def test_appointment_scheduling_workflow(self, monkeypatch):
        """Test appointment scheduling workflow"""
        # Mock data
        customer = {"id": "cust_123", "name": "Test Customer"}
        
        upcoming_appointments = {
            "appointments": [
                {
                    "id": "apt_1",
                    "scheduledAt": (datetime.utcnow() + timedelta(days=1, hours=10)).isoformat(),
                    "duration": 60
                },
                {
                    "id": "apt_2",
                    "scheduledAt": (datetime.utcnow() + timedelta(days=1, hours=14)).isoformat(),
                    "duration": 60
                }
            ]
        }
        
        new_appointment = {
            "id": "apt_new_123",
            "customerId": "cust_123",
            "scheduledAt": (datetime.utcnow() + timedelta(days=1, hours=12)).isoformat(),
            "duration": 60,
            "title": "Consultation",
            "status": "scheduled"
        }
        
        # Mock BMS client
        mock_get_customer = AsyncMock(return_value=customer)
        mock_get_appointments = AsyncMock(return_value=upcoming_appointments)
        mock_create_appointment = AsyncMock(return_value=new_appointment)
        
        monkeypatch.setattr("src.resources.customers.bms_client.get_customer", mock_get_customer)
        monkeypatch.setattr("src.resources.appointments.bms_client.get_appointments", mock_get_appointments)
        monkeypatch.setattr("src.tools.appointment_tools.bms_client.create_appointment", mock_create_appointment)
        
        # Step 1: Get customer info
        customer_result = await CustomerResources.read_resource("bms://customers/cust_123")
        assert customer_result["data"]["name"] == "Test Customer"
        
        # Step 2: Check upcoming appointments
        from src.resources.appointments import AppointmentResources
        upcoming_result = await AppointmentResources.read_resource("bms://appointments/upcoming")
        
        assert len(upcoming_result["data"]["appointments"]) == 2
        
        # Step 3: Find available slot (12:00 is free between 10:00 and 14:00)
        # In real implementation, this would involve more complex logic
        available_slot = datetime.utcnow() + timedelta(days=1, hours=12)
        
        # Step 4: Create appointment
        from src.tools.appointment_tools import AppointmentTools
        create_result = await AppointmentTools.execute_tool(
            "appointment_create",
            {
                "customer_id": "cust_123",
                "scheduled_at": available_slot.isoformat() + "Z",
                "duration_minutes": 60,
                "title": "Consultation",
                "location": "Office"
            }
        )
        
        assert "Successfully created appointment" in create_result[0].text
        assert "apt_new_123" in create_result[0].text
    
    @pytest.mark.asyncio
    async def test_dashboard_alert_workflow(self, monkeypatch):
        """Test dashboard monitoring and alert workflow"""
        # Mock data with concerning metrics
        dashboard_stats = {
            "customers": {"total": 100, "active": 80},
            "requests": {"total": 50, "pending": 25, "completion_rate": 70},
            "appointments": {"total": 30, "upcoming": 15, "no_show_rate": 20},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Mock BMS client
        mock_get_stats = AsyncMock(return_value=dashboard_stats)
        monkeypatch.setattr("src.resources.dashboard.bms_client.get_dashboard_stats", mock_get_stats)
        
        # Step 1: Get dashboard alerts
        from src.resources.dashboard import DashboardResources
        alerts_result = await DashboardResources.read_resource("bms://dashboard/alerts")
        
        alerts = alerts_result["data"]["alerts"]
        
        # Should have alerts for high pending requests and low completion rate
        assert len(alerts) >= 2
        
        # Check for pending requests alert
        pending_alert = next((a for a in alerts if a["category"] == "requests"), None)
        assert pending_alert is not None
        assert pending_alert["priority"] == "high"  # 25 pending is > 20
        assert "25 requests are pending" in pending_alert["message"]
        
        # Check for completion rate alert
        performance_alert = next((a for a in alerts if a["category"] == "performance"), None)
        assert performance_alert is not None
        assert "70%" in performance_alert["message"]
    
    @pytest.mark.asyncio
    async def test_error_recovery_workflow(self, monkeypatch):
        """Test error handling and recovery in workflows"""
        # Mock initial failure then success
        call_count = 0
        
        async def mock_create_customer(data):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("Database connection error")
            return {"id": "cust_123", "name": data["name"]}
        
        monkeypatch.setattr("src.tools.customer_tools.bms_client.create_customer", mock_create_customer)
        
        # First attempt - should fail
        result1 = await CustomerTools.execute_tool(
            "customer_create",
            {"name": "Test", "email": "test@test.com"}
        )
        
        assert "Error executing customer_create" in result1[0].text
        assert "Database connection error" in result1[0].text
        
        # Second attempt - should succeed
        result2 = await CustomerTools.execute_tool(
            "customer_create",
            {"name": "Test", "email": "test@test.com"}
        )
        
        assert "Successfully created customer" in result2[0].text
        assert call_count == 2