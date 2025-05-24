"""
Tests for MCP tools
"""

import pytest
from unittest.mock import AsyncMock, patch
from mcp.types import TextContent

from src.tools.customer_tools import CustomerTools
from src.tools.request_tools import RequestTools
from src.tools.appointment_tools import AppointmentTools
from src.tools.automation_tools import AutomationTools
from src.tools.auth_tools import AuthTools


class TestCustomerTools:
    """Test customer management tools"""
    
    @pytest.mark.asyncio
    async def test_list_tools(self):
        """Test listing customer tools"""
        tools = CustomerTools.list_tools()
        
        assert len(tools) == 4
        tool_names = [t.name for t in tools]
        assert "customer_create" in tool_names
        assert "customer_update" in tool_names
        assert "customer_add_note" in tool_names
        assert "customer_change_status" in tool_names
    
    @pytest.mark.asyncio
    async def test_create_customer(self, monkeypatch, sample_customer_data):
        """Test creating a customer"""
        # Mock bms_client
        mock_create = AsyncMock(return_value=sample_customer_data)
        mock_add_note = AsyncMock(return_value={"success": True})
        monkeypatch.setattr("src.tools.customer_tools.bms_client.create_customer", mock_create)
        monkeypatch.setattr("src.tools.customer_tools.bms_client.add_customer_note", mock_add_note)
        
        # Test
        arguments = {
            "name": "Test Customer",
            "email": "test@example.com",
            "phone": "+1234567890",
            "notes": "Initial note"
        }
        
        result = await CustomerTools.execute_tool("customer_create", arguments)
        
        # Verify
        assert len(result) == 1
        assert isinstance(result[0], TextContent)
        assert "Successfully created customer" in result[0].text
        assert "cust_123" in result[0].text
        
        # Verify note was added
        mock_add_note.assert_called_once_with("cust_123", "Initial note")
    
    @pytest.mark.asyncio
    async def test_update_customer(self, monkeypatch):
        """Test updating a customer"""
        # Mock bms_client
        mock_update = AsyncMock(return_value={"success": True})
        monkeypatch.setattr("src.tools.customer_tools.bms_client.update_customer", mock_update)
        
        # Test
        arguments = {
            "customer_id": "cust_123",
            "name": "Updated Name",
            "status": "inactive"
        }
        
        result = await CustomerTools.execute_tool("customer_update", arguments)
        
        # Verify
        assert "Successfully updated customer" in result[0].text
        mock_update.assert_called_once_with(
            "cust_123",
            {"name": "Updated Name", "status": "inactive"}
        )
    
    @pytest.mark.asyncio
    async def test_change_status_with_reason(self, monkeypatch):
        """Test changing customer status with reason"""
        # Mock bms_client
        mock_update = AsyncMock(return_value={"success": True})
        mock_add_note = AsyncMock(return_value={"success": True})
        monkeypatch.setattr("src.tools.customer_tools.bms_client.update_customer", mock_update)
        monkeypatch.setattr("src.tools.customer_tools.bms_client.add_customer_note", mock_add_note)
        
        # Test
        arguments = {
            "customer_id": "cust_123",
            "status": "inactive",
            "reason": "No longer using service"
        }
        
        result = await CustomerTools.execute_tool("customer_change_status", arguments)
        
        # Verify
        assert "Successfully changed customer" in result[0].text
        mock_add_note.assert_called_once_with(
            "cust_123",
            "Status changed to inactive: No longer using service"
        )
    
    @pytest.mark.asyncio
    async def test_tool_error_handling(self, monkeypatch):
        """Test error handling in tools"""
        # Mock bms_client to raise error
        mock_create = AsyncMock(side_effect=Exception("API Error"))
        monkeypatch.setattr("src.tools.customer_tools.bms_client.create_customer", mock_create)
        
        # Test
        result = await CustomerTools.execute_tool("customer_create", {"name": "Test", "email": "test@test.com"})
        
        # Verify
        assert "Error executing customer_create" in result[0].text
        assert "API Error" in result[0].text


class TestRequestTools:
    """Test request management tools"""
    
    @pytest.mark.asyncio
    async def test_create_request(self, monkeypatch, sample_request_data):
        """Test creating a request"""
        # Mock bms_client
        mock_create = AsyncMock(return_value=sample_request_data)
        monkeypatch.setattr("src.tools.request_tools.bms_client.create_request", mock_create)
        
        # Test
        arguments = {
            "customer_id": "cust_123",
            "subject": "Test Request",
            "description": "Test description",
            "priority": "high"
        }
        
        result = await RequestTools.execute_tool("request_create", arguments)
        
        # Verify
        assert "Successfully created request" in result[0].text
        assert "req_456" in result[0].text
    
    @pytest.mark.asyncio
    async def test_assign_request_with_note(self, monkeypatch):
        """Test assigning a request with note"""
        # Mock bms_client
        mock_assign = AsyncMock(return_value={"success": True})
        mock_update = AsyncMock(return_value={"success": True})
        monkeypatch.setattr("src.tools.request_tools.bms_client.assign_request", mock_assign)
        monkeypatch.setattr("src.tools.request_tools.bms_client.update_request", mock_update)
        
        # Test
        arguments = {
            "request_id": "req_456",
            "user_id": "user_123",
            "note": "Assigned to specialist"
        }
        
        result = await RequestTools.execute_tool("request_assign", arguments)
        
        # Verify
        assert "Successfully assigned request" in result[0].text
        
        # Verify note was added
        note_call = mock_update.call_args[0][1]
        assert "notes" in note_call
        assert note_call["notes"][0]["type"] == "assignment"
    
    @pytest.mark.asyncio
    async def test_convert_to_appointment(self, monkeypatch):
        """Test converting request to appointment"""
        # Mock bms_client
        mock_convert = AsyncMock(return_value={"id": "apt_789"})
        monkeypatch.setattr("src.tools.request_tools.bms_client.convert_request_to_appointment", mock_convert)
        
        # Test
        arguments = {
            "request_id": "req_456",
            "scheduled_at": "2024-01-20T14:00:00Z",
            "duration_minutes": 60,
            "location": "Office"
        }
        
        result = await RequestTools.execute_tool("request_convert_to_appointment", arguments)
        
        # Verify
        assert "Successfully converted request" in result[0].text
        assert "2024-01-20" in result[0].text


class TestAppointmentTools:
    """Test appointment management tools"""
    
    @pytest.mark.asyncio
    async def test_create_appointment(self, monkeypatch, sample_appointment_data):
        """Test creating an appointment"""
        # Mock bms_client
        mock_create = AsyncMock(return_value=sample_appointment_data)
        monkeypatch.setattr("src.tools.appointment_tools.bms_client.create_appointment", mock_create)
        
        # Test
        arguments = {
            "customer_id": "cust_123",
            "scheduled_at": "2024-01-20T14:00:00Z",
            "duration_minutes": 60,
            "title": "Consultation",
            "location": "Office"
        }
        
        result = await AppointmentTools.execute_tool("appointment_create", arguments)
        
        # Verify
        assert "Successfully created appointment" in result[0].text
        assert "Consultation" in result[0].text
        assert "apt_789" in result[0].text
    
    @pytest.mark.asyncio
    async def test_cancel_appointment(self, monkeypatch):
        """Test cancelling an appointment"""
        # Mock bms_client
        mock_cancel = AsyncMock(return_value={"success": True})
        monkeypatch.setattr("src.tools.appointment_tools.bms_client.cancel_appointment", mock_cancel)
        
        # Test
        arguments = {
            "appointment_id": "apt_789",
            "reason": "Customer requested",
            "notify_customer": True
        }
        
        result = await AppointmentTools.execute_tool("appointment_cancel", arguments)
        
        # Verify
        assert "Successfully cancelled appointment" in result[0].text
        assert "Customer will be notified" in result[0].text
    
    @pytest.mark.asyncio
    async def test_complete_appointment_with_followup(self, monkeypatch):
        """Test completing appointment with follow-up"""
        # Mock bms_client
        mock_update = AsyncMock(return_value={"success": True})
        monkeypatch.setattr("src.tools.appointment_tools.bms_client.update_appointment", mock_update)
        
        # Test
        arguments = {
            "appointment_id": "apt_789",
            "notes": "Completed successfully",
            "follow_up_required": True
        }
        
        result = await AppointmentTools.execute_tool("appointment_complete", arguments)
        
        # Verify
        assert "Successfully completed appointment" in result[0].text
        assert "Follow-up required" in result[0].text
        
        # Check update data
        update_call = mock_update.call_args[0][1]
        assert update_call["status"] == "completed"
        assert update_call["followUpRequired"] is True


class TestAutomationTools:
    """Test automation tools"""
    
    @pytest.mark.asyncio
    async def test_trigger_webhook(self, monkeypatch):
        """Test triggering a webhook"""
        # Mock bms_client
        mock_trigger = AsyncMock(return_value={"executionId": "exec_123"})
        monkeypatch.setattr("src.tools.automation_tools.bms_client.trigger_webhook", mock_trigger)
        
        # Test
        arguments = {
            "webhook_id": "webhook_456",
            "payload": {"test": "data"},
            "test_mode": True
        }
        
        result = await AutomationTools.execute_tool("automation_trigger_webhook", arguments)
        
        # Verify
        assert "Successfully triggered webhook" in result[0].text
        assert "exec_123" in result[0].text
        
        # Check payload includes metadata
        trigger_call = mock_trigger.call_args[0][1]
        assert "_metadata" in trigger_call
        assert trigger_call["_metadata"]["test_mode"] is True
    
    @pytest.mark.asyncio
    async def test_execute_workflow_process_requests(self, monkeypatch, sample_request_data, sample_user_data):
        """Test executing process pending requests workflow"""
        # Mock bms_client
        mock_get_requests = AsyncMock(return_value={
            "requests": [sample_request_data]
        })
        mock_get_users = AsyncMock(return_value={
            "users": [sample_user_data]
        })
        mock_assign = AsyncMock(return_value={"success": True})
        
        monkeypatch.setattr("src.tools.automation_tools.bms_client.get_requests", mock_get_requests)
        monkeypatch.setattr("src.tools.automation_tools.bms_client.get_users", mock_get_users)
        monkeypatch.setattr("src.tools.automation_tools.bms_client.assign_request", mock_assign)
        
        # Test
        arguments = {
            "workflow_name": "process_pending_requests",
            "context": {},
            "async_execution": False
        }
        
        result = await AutomationTools.execute_tool("workflow_execute", arguments)
        
        # Verify
        assert "Workflow 'process_pending_requests' executed" in result[0].text
        assert "Processed 1 pending requests" in result[0].text


class TestAuthTools:
    """Test authentication tools"""
    
    @pytest.mark.asyncio
    async def test_login(self, monkeypatch, sample_auth_response):
        """Test login tool"""
        # Mock httpx client
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = AsyncMock(return_value=sample_auth_response)
        
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        
        mock_client_class = AsyncMock()
        mock_client_class.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_class.__aexit__ = AsyncMock(return_value=None)
        
        monkeypatch.setattr("httpx.AsyncClient", lambda: mock_client_class)
        
        # Test
        arguments = {
            "email": "test@example.com",
            "password": "password123",
            "save_token": True
        }
        
        result = await AuthTools.execute_tool("auth_login", arguments)
        
        # Verify
        assert "Successfully logged in" in result[0].text
        assert "Test User" in result[0].text
        assert "Access Token:" in result[0].text
        assert "Refresh Token:" in result[0].text
    
    @pytest.mark.asyncio
    async def test_validate_token(self, monkeypatch, sample_user_data):
        """Test token validation"""
        # Mock httpx client
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = AsyncMock(return_value=sample_user_data)
        
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        
        mock_client_class = AsyncMock()
        mock_client_class.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_class.__aexit__ = AsyncMock(return_value=None)
        
        monkeypatch.setattr("httpx.AsyncClient", lambda: mock_client_class)
        
        # Test
        arguments = {"token": "valid-token"}
        result = await AuthTools.execute_tool("auth_validate", arguments)
        
        # Verify
        assert "Token is valid" in result[0].text
        assert "Test User" in result[0].text