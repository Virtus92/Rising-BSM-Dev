"""
Tests for MCP server
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
import json
from mcp.types import Resource, Tool, TextContent, Prompt, PromptMessage

from src.mcp_server import BMSMCPServer


class TestMCPServer:
    """Test MCP server functionality"""
    
    @pytest.fixture
    async def mcp_server(self, monkeypatch, test_settings):
        """Create MCP server instance with mocked dependencies"""
        monkeypatch.setattr("src.mcp_server.settings", test_settings)
        
        # Mock auth client
        mock_auth = AsyncMock()
        mock_auth.get_service_account_info = AsyncMock(return_value={
            "id": "service_123",
            "email": "service@test.com"
        })
        monkeypatch.setattr("src.mcp_server.auth_client", mock_auth)
        
        server = BMSMCPServer()
        return server
    
    @pytest.mark.asyncio
    async def test_list_resources(self, mcp_server, monkeypatch):
        """Test listing all resources"""
        # Mock resource modules
        mock_customer_resources = AsyncMock(return_value=[
            Resource(uri="bms://customers/list", name="Customers", description="List customers", mimeType="application/json")
        ])
        mock_request_resources = AsyncMock(return_value=[
            Resource(uri="bms://requests/list", name="Requests", description="List requests", mimeType="application/json")
        ])
        
        monkeypatch.setattr("src.mcp_server.customer_resources.list_resources", mock_customer_resources)
        monkeypatch.setattr("src.mcp_server.request_resources.list_resources", mock_request_resources)
        monkeypatch.setattr("src.mcp_server.appointment_resources.list_resources", AsyncMock(return_value=[]))
        monkeypatch.setattr("src.mcp_server.dashboard_resources.list_resources", AsyncMock(return_value=[]))
        
        # Get handler and call it
        handler = mcp_server.server._request_handlers.get("resources/list")
        resources = await handler()
        
        assert len(resources) >= 2
        assert any(r.uri == "bms://customers/list" for r in resources)
        assert any(r.uri == "bms://requests/list" for r in resources)
    
    @pytest.mark.asyncio
    async def test_read_resource(self, mcp_server, monkeypatch, sample_customer_data):
        """Test reading a specific resource"""
        # Mock resource read
        mock_read = AsyncMock(return_value={
            "type": "customer_detail",
            "data": sample_customer_data
        })
        monkeypatch.setattr("src.mcp_server.customer_resources.read_resource", mock_read)
        
        # Get handler and call it
        handler = mcp_server.server._request_handlers.get("resources/read")
        result = await handler(uri="bms://customers/cust_123")
        
        # Result should be JSON string
        data = json.loads(result)
        assert data["type"] == "customer_detail"
        assert data["data"]["id"] == "cust_123"
    
    @pytest.mark.asyncio
    async def test_read_unknown_resource(self, mcp_server):
        """Test reading unknown resource URI"""
        handler = mcp_server.server._request_handlers.get("resources/read")
        
        with pytest.raises(ValueError, match="Unknown resource URI"):
            await handler(uri="bms://unknown/resource")
    
    @pytest.mark.asyncio
    async def test_list_tools(self, mcp_server, monkeypatch):
        """Test listing all tools"""
        # Mock tool modules
        mock_customer_tools = Mock()
        mock_customer_tools.list_tools.return_value = [
            Tool(name="customer_create", description="Create customer", inputSchema={})
        ]
        mock_request_tools = Mock()
        mock_request_tools.list_tools.return_value = [
            Tool(name="request_create", description="Create request", inputSchema={})
        ]
        
        monkeypatch.setattr("src.mcp_server.customer_tools", mock_customer_tools)
        monkeypatch.setattr("src.mcp_server.request_tools", mock_request_tools)
        monkeypatch.setattr("src.mcp_server.appointment_tools.list_tools", lambda: [])
        monkeypatch.setattr("src.mcp_server.automation_tools.list_tools", lambda: [])
        monkeypatch.setattr("src.mcp_server.auth_tools.list_tools", lambda: [])
        
        # Get handler and call it
        handler = mcp_server.server._request_handlers.get("tools/list")
        tools = await handler()
        
        assert len(tools) >= 2
        assert any(t.name == "customer_create" for t in tools)
        assert any(t.name == "request_create" for t in tools)
    
    @pytest.mark.asyncio
    async def test_call_tool(self, mcp_server, monkeypatch):
        """Test calling a tool"""
        # Mock tool execution
        mock_execute = AsyncMock(return_value=[
            TextContent(type="text", text="Customer created successfully")
        ])
        monkeypatch.setattr("src.mcp_server.customer_tools.execute_tool", mock_execute)
        
        # Get handler and call it
        handler = mcp_server.server._request_handlers.get("tools/call")
        result = await handler(
            name="customer_create",
            arguments={"name": "Test", "email": "test@test.com"}
        )
        
        assert len(result) == 1
        assert result[0].text == "Customer created successfully"
    
    @pytest.mark.asyncio
    async def test_call_unknown_tool(self, mcp_server):
        """Test calling unknown tool"""
        handler = mcp_server.server._request_handlers.get("tools/call")
        
        result = await handler(name="unknown_tool", arguments={})
        
        assert len(result) == 1
        assert "Error executing tool unknown_tool" in result[0].text
        assert "Unknown tool" in result[0].text
    
    @pytest.mark.asyncio
    async def test_list_prompts(self, mcp_server):
        """Test listing prompts"""
        handler = mcp_server.server._request_handlers.get("prompts/list")
        prompts = await handler()
        
        assert len(prompts) > 0
        
        # Check some expected prompts
        prompt_names = [p.name for p in prompts]
        assert "process_new_request" in prompt_names
        assert "find_appointment_slot" in prompt_names
        assert "business_analysis" in prompt_names
    
    @pytest.mark.asyncio
    async def test_get_prompt(self, mcp_server):
        """Test getting a specific prompt"""
        handler = mcp_server.server._request_handlers.get("prompts/get")
        
        # Test process_new_request prompt
        prompt = await handler(
            name="process_new_request",
            arguments={"request_id": "req_123"}
        )
        
        assert prompt.name == "process_new_request"
        assert len(prompt.messages) == 1
        assert isinstance(prompt.messages[0], PromptMessage)
        assert "req_123" in prompt.messages[0].content.text
    
    @pytest.mark.asyncio
    async def test_get_prompt_missing_required_arg(self, mcp_server):
        """Test getting prompt without required argument"""
        handler = mcp_server.server._request_handlers.get("prompts/get")
        
        with pytest.raises(ValueError, match="request_id is required"):
            await handler(name="process_new_request", arguments={})
    
    @pytest.mark.asyncio
    async def test_get_unknown_prompt(self, mcp_server):
        """Test getting unknown prompt"""
        handler = mcp_server.server._request_handlers.get("prompts/get")
        
        with pytest.raises(ValueError, match="Unknown prompt"):
            await handler(name="unknown_prompt", arguments={})
    
    @pytest.mark.asyncio
    async def test_server_initialization(self, mcp_server, monkeypatch):
        """Test server initialization with auth"""
        # Mock auth client
        mock_get_info = AsyncMock(return_value={
            "id": "service_123",
            "email": "service@test.com",
            "role": "service_account"
        })
        monkeypatch.setattr("src.mcp_server.auth_client.get_service_account_info", mock_get_info)
        
        # Mock server run
        mock_run = AsyncMock()
        monkeypatch.setattr("src.mcp_server.BMSMCPServer.server.run_stdio", mock_run)
        
        # Mock event wait
        mock_event = AsyncMock()
        mock_event.wait = AsyncMock()
        monkeypatch.setattr("asyncio.Event", lambda: mock_event)
        
        # This would normally run forever, so we'll just test initialization
        await mcp_server.run()
        
        # Verify auth was called
        mock_get_info.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_tool_error_handling(self, mcp_server, monkeypatch):
        """Test tool execution error handling"""
        # Mock tool to raise exception
        mock_execute = AsyncMock(side_effect=Exception("Tool error"))
        monkeypatch.setattr("src.mcp_server.customer_tools.execute_tool", mock_execute)
        
        handler = mcp_server.server._request_handlers.get("tools/call")
        result = await handler(name="customer_create", arguments={})
        
        # Should return error message, not raise
        assert len(result) == 1
        assert "Error executing tool customer_create" in result[0].text
        assert "Tool error" in result[0].text