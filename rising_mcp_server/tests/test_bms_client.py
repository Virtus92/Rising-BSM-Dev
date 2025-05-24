"""
Tests for BMS API client
"""

import pytest
from unittest.mock import Mock, patch
import httpx

from src.bms_client import BMSClient, BMSAPIError


class TestBMSClient:
    """Test BMSClient class"""
    
    @pytest.mark.asyncio
    async def test_request_success(self, mock_bms_client, mock_httpx_client):
        """Test successful API request"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_httpx_client.request.return_value = mock_response
        
        # Test
        result = await mock_bms_client._request("GET", "/test")
        
        # Verify
        assert result == {"success": True}
        mock_httpx_client.request.assert_called_once_with(
            method="GET",
            url="https://test-bms.com/api/test",
            headers={
                "Authorization": "Bearer test-jwt-token",
                "Content-Type": "application/json"
            }
        )
    
    @pytest.mark.asyncio
    async def test_request_api_error(self, mock_bms_client, mock_httpx_client):
        """Test API request with error response"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.content = b'{"message": "Bad request"}'
        mock_response.json.return_value = {"message": "Bad request"}
        mock_httpx_client.request.return_value = mock_response
        
        # Test
        with pytest.raises(BMSAPIError, match="BMS API error \\(400\\): Bad request"):
            await mock_bms_client._request("POST", "/test")
    
    @pytest.mark.asyncio
    async def test_request_http_error(self, mock_bms_client, mock_httpx_client):
        """Test API request with HTTP error"""
        # Setup mock to raise HTTP error
        mock_httpx_client.request.side_effect = httpx.HTTPError("Connection failed")
        
        # Test
        with pytest.raises(BMSAPIError, match="Failed to communicate with BMS API"):
            await mock_bms_client._request("GET", "/test")
    
    @pytest.mark.asyncio
    async def test_get_customers(self, mock_bms_client, mock_httpx_client, sample_customer_data):
        """Test getting customers"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "customers": [sample_customer_data],
            "total": 1
        }
        mock_httpx_client.request.return_value = mock_response
        
        # Test
        result = await mock_bms_client.get_customers(limit=10, status="active")
        
        # Verify
        assert result["total"] == 1
        assert result["customers"][0]["id"] == "cust_123"
        mock_httpx_client.request.assert_called_once()
        
        # Check params were passed correctly
        call_kwargs = mock_httpx_client.request.call_args.kwargs
        assert call_kwargs.get("params") == {"limit": 10, "offset": 0, "status": "active"}
    
    @pytest.mark.asyncio
    async def test_create_customer(self, mock_bms_client, mock_httpx_client, sample_customer_data):
        """Test creating a customer"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_customer_data
        mock_httpx_client.request.return_value = mock_response
        
        # Test
        customer_data = {
            "name": "Test Customer",
            "email": "test@example.com"
        }
        result = await mock_bms_client.create_customer(customer_data)
        
        # Verify
        assert result["id"] == "cust_123"
        mock_httpx_client.request.assert_called_once()
        
        # Check JSON data was passed
        call_kwargs = mock_httpx_client.request.call_args.kwargs
        assert call_kwargs.get("json") == customer_data
    
    @pytest.mark.asyncio
    async def test_get_requests_with_filters(self, mock_bms_client, mock_httpx_client, sample_request_data):
        """Test getting requests with various filters"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "requests": [sample_request_data],
            "total": 1
        }
        mock_httpx_client.request.return_value = mock_response
        
        # Test
        result = await mock_bms_client.get_requests(
            limit=20,
            status="pending",
            assigned=False,
            assigned_to="user_123"
        )
        
        # Verify
        assert result["total"] == 1
        assert result["requests"][0]["id"] == "req_456"
        
        # Check all params were passed
        call_kwargs = mock_httpx_client.request.call_args.kwargs
        params = call_kwargs.get("params")
        assert params["limit"] == 20
        assert params["status"] == "pending"
        assert params["assigned"] is False
        assert params["assignedTo"] == "user_123"
    
    @pytest.mark.asyncio
    async def test_assign_request(self, mock_bms_client, mock_httpx_client):
        """Test assigning a request"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_httpx_client.request.return_value = mock_response
        
        # Test
        result = await mock_bms_client.assign_request("req_456", "user_123")
        
        # Verify
        assert result["success"] is True
        mock_httpx_client.request.assert_called_once()
        
        # Check correct endpoint and data
        call_args = mock_httpx_client.request.call_args
        assert "/requests/req_456/assign" in call_args.kwargs["url"]
        assert call_args.kwargs["json"] == {"userId": "user_123"}
    
    @pytest.mark.asyncio
    async def test_get_appointments_upcoming(self, mock_bms_client, mock_httpx_client, sample_appointment_data):
        """Test getting upcoming appointments"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "appointments": [sample_appointment_data],
            "total": 1
        }
        mock_httpx_client.request.return_value = mock_response
        
        # Test
        result = await mock_bms_client.get_appointments(upcoming=True)
        
        # Verify
        assert result["total"] == 1
        assert result["appointments"][0]["id"] == "apt_789"
        
        # Check upcoming param
        call_kwargs = mock_httpx_client.request.call_args.kwargs
        assert call_kwargs.get("params")["upcoming"] is True
    
    @pytest.mark.asyncio
    async def test_cancel_appointment(self, mock_bms_client, mock_httpx_client):
        """Test cancelling an appointment"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_httpx_client.request.return_value = mock_response
        
        # Test
        result = await mock_bms_client.cancel_appointment("apt_789", "Customer requested")
        
        # Verify
        assert result["success"] is True
        
        # Check endpoint and reason
        call_args = mock_httpx_client.request.call_args
        assert "/appointments/apt_789/cancel" in call_args.kwargs["url"]
        assert call_args.kwargs["json"] == {"reason": "Customer requested"}
    
    @pytest.mark.asyncio
    async def test_get_dashboard_stats(self, mock_bms_client, mock_httpx_client):
        """Test getting dashboard statistics"""
        # Setup mock responses for each stat call
        stats_responses = [
            {"total": 100, "active": 80},  # Customer stats
            {"total": 50, "pending": 10},  # Request stats
            {"total": 30, "upcoming": 5}   # Appointment stats
        ]
        
        mock_responses = []
        for stats in stats_responses:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = stats
            mock_responses.append(mock_response)
        
        mock_httpx_client.request.side_effect = mock_responses
        
        # Test
        result = await mock_bms_client.get_dashboard_stats()
        
        # Verify
        assert result["customers"]["total"] == 100
        assert result["requests"]["pending"] == 10
        assert result["appointments"]["upcoming"] == 5
        assert "timestamp" in result
        
        # Verify all three calls were made
        assert mock_httpx_client.request.call_count == 3
    
    @pytest.mark.asyncio
    async def test_create_webhook(self, mock_bms_client, mock_httpx_client):
        """Test creating a webhook"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": "webhook_123", "active": True}
        mock_httpx_client.request.return_value = mock_response
        
        # Test
        webhook_data = {
            "name": "Test Webhook",
            "url": "https://example.com/webhook",
            "entityType": "customer",
            "eventType": "created"
        }
        result = await mock_bms_client.create_webhook(webhook_data)
        
        # Verify
        assert result["id"] == "webhook_123"
        assert "/automation/webhooks" in mock_httpx_client.request.call_args.kwargs["url"]