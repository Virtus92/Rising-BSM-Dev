"""
Tests for authentication module
"""

import pytest
from unittest.mock import AsyncMock, Mock
import httpx

from src.auth import (
    BMSAuthClient, 
    AuthenticationError, 
    verify_bearer_token, 
    verify_mcp_auth
)


class TestBMSAuthClient:
    """Test BMSAuthClient class"""
    
    @pytest.mark.asyncio
    async def test_verify_token_success(self, mock_auth_client, mock_httpx_client, sample_user_data):
        """Test successful token verification"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_user_data
        mock_httpx_client.get.return_value = mock_response
        
        # Test
        result = await mock_auth_client.verify_token("valid-token")
        
        # Verify
        assert result == sample_user_data
        mock_httpx_client.get.assert_called_once_with(
            "https://test-bms.com/api/auth/me",
            headers={"Authorization": "Bearer valid-token"}
        )
    
    @pytest.mark.asyncio
    async def test_verify_token_invalid(self, mock_auth_client, mock_httpx_client):
        """Test invalid token verification"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Unauthorized", request=Mock(), response=mock_response
        )
        mock_httpx_client.get.return_value = mock_response
        
        # Test
        with pytest.raises(AuthenticationError, match="Invalid or expired token"):
            await mock_auth_client.verify_token("invalid-token")
    
    @pytest.mark.asyncio
    async def test_verify_token_http_error(self, mock_auth_client, mock_httpx_client):
        """Test token verification with HTTP error"""
        # Setup mock to raise HTTP error
        mock_httpx_client.get.side_effect = httpx.HTTPError("Connection error")
        
        # Test
        with pytest.raises(AuthenticationError, match="Failed to verify authentication"):
            await mock_auth_client.verify_token("any-token")
    
    @pytest.mark.asyncio
    async def test_get_service_account_info_cached(self, mock_auth_client, mock_httpx_client, sample_user_data):
        """Test getting service account info with caching"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_user_data
        mock_httpx_client.get.return_value = mock_response
        
        # First call - should hit API
        result1 = await mock_auth_client.get_service_account_info()
        assert result1 == sample_user_data
        assert mock_httpx_client.get.call_count == 1
        
        # Second call - should use cache
        result2 = await mock_auth_client.get_service_account_info()
        assert result2 == sample_user_data
        assert mock_httpx_client.get.call_count == 1  # No additional call
    
    @pytest.mark.asyncio
    async def test_check_permission_allowed(self, mock_auth_client, mock_httpx_client):
        """Test permission check when allowed"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"allowed": True}
        mock_httpx_client.post.return_value = mock_response
        
        # Test
        result = await mock_auth_client.check_permission("customers", "read")
        
        # Verify
        assert result is True
        mock_httpx_client.post.assert_called_once_with(
            "https://test-bms.com/api/permissions/check",
            headers={"Authorization": "Bearer test-jwt-token"},
            json={"resource": "customers", "action": "read"}
        )
    
    @pytest.mark.asyncio
    async def test_check_permission_denied(self, mock_auth_client, mock_httpx_client):
        """Test permission check when denied"""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"allowed": False}
        mock_httpx_client.post.return_value = mock_response
        
        # Test
        result = await mock_auth_client.check_permission("admin", "delete")
        
        # Verify
        assert result is False
    
    @pytest.mark.asyncio
    async def test_check_permission_error(self, mock_auth_client, mock_httpx_client):
        """Test permission check with error"""
        # Setup mock to raise exception
        mock_httpx_client.post.side_effect = Exception("Network error")
        
        # Test
        result = await mock_auth_client.check_permission("any", "action")
        
        # Verify - should return False on error
        assert result is False


class TestAuthFunctions:
    """Test authentication helper functions"""
    
    @pytest.mark.asyncio
    async def test_verify_bearer_token_success(self, monkeypatch, sample_user_data):
        """Test successful bearer token verification"""
        # Mock auth_client.verify_token
        mock_verify = AsyncMock(return_value=sample_user_data)
        monkeypatch.setattr("src.auth.auth_client.verify_token", mock_verify)
        
        # Test
        result = await verify_bearer_token("Bearer valid-token")
        
        # Verify
        assert result == sample_user_data
        mock_verify.assert_called_once_with("valid-token")
    
    @pytest.mark.asyncio
    async def test_verify_bearer_token_no_header(self):
        """Test bearer token verification with no header"""
        with pytest.raises(AuthenticationError, match="No authorization header provided"):
            await verify_bearer_token(None)
    
    @pytest.mark.asyncio
    async def test_verify_bearer_token_invalid_format(self):
        """Test bearer token verification with invalid format"""
        with pytest.raises(AuthenticationError, match="Invalid authorization header format"):
            await verify_bearer_token("Basic sometoken")
    
    @pytest.mark.asyncio
    async def test_verify_bearer_token_empty_token(self):
        """Test bearer token verification with empty token"""
        with pytest.raises(AuthenticationError, match="No token provided"):
            await verify_bearer_token("Bearer ")
    
    @pytest.mark.asyncio
    async def test_verify_mcp_auth_with_api_key(self, test_settings):
        """Test MCP auth verification with API key"""
        # Test with matching API key
        result = await verify_mcp_auth(f"Bearer {test_settings.bms_api_key}")
        assert result is True
        
        # Test with wrong API key
        result = await verify_mcp_auth("Bearer wrong-key")
        assert result is False
    
    @pytest.mark.asyncio
    async def test_verify_mcp_auth_with_bms_token(self, monkeypatch, sample_user_data):
        """Test MCP auth verification with BMS token"""
        # Mock verify_bearer_token to succeed
        mock_verify = AsyncMock(return_value=sample_user_data)
        monkeypatch.setattr("src.auth.verify_bearer_token", mock_verify)
        
        # Test
        result = await verify_mcp_auth("Bearer some-bms-token")
        assert result is True
    
    @pytest.mark.asyncio
    async def test_verify_mcp_auth_invalid(self, monkeypatch):
        """Test MCP auth verification with invalid token"""
        # Mock verify_bearer_token to raise AuthenticationError
        mock_verify = AsyncMock(side_effect=AuthenticationError("Invalid token"))
        monkeypatch.setattr("src.auth.verify_bearer_token", mock_verify)
        
        # Test
        result = await verify_mcp_auth("Bearer invalid-token")
        assert result is False
    
    @pytest.mark.asyncio
    async def test_verify_mcp_auth_no_header(self):
        """Test MCP auth verification with no header"""
        result = await verify_mcp_auth(None)
        assert result is False