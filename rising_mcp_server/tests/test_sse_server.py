"""
Tests for SSE server
"""

import pytest
import json
import asyncio
from unittest.mock import AsyncMock, Mock, patch
from httpx import AsyncClient

from src.sse_server import app, broadcast_event, active_connections


class TestSSEServer:
    """Test SSE server endpoints"""
    
    @pytest.mark.asyncio
    async def test_health_check(self, test_client):
        """Test health check endpoint"""
        response = await test_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_root_endpoint(self, test_client):
        """Test root endpoint"""
        response = await test_client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "endpoints" in data
        assert data["endpoints"]["sse_events"] == "/sse/events"
    
    @pytest.mark.asyncio
    async def test_sse_events_unauthorized(self, test_client):
        """Test SSE events without authorization"""
        with patch("src.sse_server.verify_mcp_auth", return_value=False):
            response = await test_client.get("/sse/events")
            assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_sse_events_authorized(self, test_client, auth_headers):
        """Test SSE events with authorization"""
        with patch("src.sse_server.verify_mcp_auth", return_value=True):
            # Start SSE connection
            async with test_client.stream("GET", "/sse/events", headers=auth_headers) as response:
                assert response.status_code == 200
                assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
                
                # Read first event (connection event)
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = json.loads(line[6:])
                        assert data["message"] == "Connected to BMS event stream"
                        break
    
    @pytest.mark.asyncio
    async def test_sse_events_with_filters(self, test_client, auth_headers):
        """Test SSE events with filters"""
        with patch("src.sse_server.verify_mcp_auth", return_value=True):
            params = {"filter_entity": "customer", "filter_event": "created"}
            
            async with test_client.stream("GET", "/sse/events", headers=auth_headers, params=params) as response:
                assert response.status_code == 200
                
                # Read connection event
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = json.loads(line[6:])
                        assert data["filters"]["entity"] == "customer"
                        assert data["filters"]["event"] == "created"
                        break
    
    @pytest.mark.asyncio
    async def test_trigger_event(self, test_client, auth_headers, sample_sse_event):
        """Test manual event trigger"""
        with patch("src.sse_server.verify_mcp_auth", return_value=True):
            with patch("src.sse_server.broadcast_event") as mock_broadcast:
                response = await test_client.post(
                    "/sse/trigger",
                    headers=auth_headers,
                    json=sample_sse_event
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "success"
                assert "event" in data
                
                # Verify broadcast was called
                mock_broadcast.assert_called_once()
                broadcast_args = mock_broadcast.call_args[0][0]
                assert broadcast_args["entity_type"] == "request"
    
    @pytest.mark.asyncio
    async def test_broadcast_event(self, mock_active_connections):
        """Test event broadcasting"""
        # Create mock queues
        queue1 = asyncio.Queue()
        queue2 = asyncio.Queue()
        mock_active_connections.add(queue1)
        mock_active_connections.add(queue2)
        
        event = {"test": "event"}
        
        with patch("src.sse_server.active_connections", mock_active_connections):
            await broadcast_event(event)
        
        # Verify events were queued
        assert not queue1.empty()
        assert not queue2.empty()
        assert await queue1.get() == event
        assert await queue2.get() == event
    
    @pytest.mark.asyncio
    async def test_broadcast_event_with_timeout(self, mock_active_connections):
        """Test broadcasting with queue timeout"""
        # Create a full queue
        full_queue = asyncio.Queue(maxsize=1)
        await full_queue.put("existing")
        
        mock_active_connections.add(full_queue)
        
        event = {"test": "event"}
        
        with patch("src.sse_server.active_connections", mock_active_connections):
            # Should not raise exception
            await broadcast_event(event)
        
        # Queue should remain full with original item
        assert full_queue.full()
    
    @pytest.mark.asyncio
    async def test_sse_heartbeat(self, test_client, auth_headers):
        """Test SSE heartbeat mechanism"""
        with patch("src.sse_server.verify_mcp_auth", return_value=True):
            with patch("src.sse_server.settings.sse_heartbeat_interval", 1):  # 1 second heartbeat
                async with test_client.stream("GET", "/sse/events", headers=auth_headers) as response:
                    events = []
                    start_time = asyncio.get_event_loop().time()
                    
                    async for line in response.aiter_lines():
                        if line.startswith("event: "):
                            events.append(line)
                            
                            # Stop after receiving heartbeat
                            if "heartbeat" in line:
                                break
                        
                        # Timeout after 3 seconds
                        if asyncio.get_event_loop().time() - start_time > 3:
                            break
                    
                    # Should have received at least one heartbeat
                    assert any("heartbeat" in event for event in events)


class TestEventPolling:
    """Test BMS event polling"""
    
    @pytest.mark.asyncio
    async def test_poll_customer_events(self, monkeypatch, sample_customer_data):
        """Test polling for customer events"""
        # Mock bms_client
        mock_get_customers = AsyncMock(return_value={
            "customers": [sample_customer_data]
        })
        monkeypatch.setattr("src.sse_server.bms_client.get_customers", mock_get_customers)
        
        # Mock broadcast_event
        mock_broadcast = AsyncMock()
        monkeypatch.setattr("src.sse_server.broadcast_event", mock_broadcast)
        
        # Import and run polling function briefly
        from src.sse_server import poll_bms_events
        
        # Run polling for a short time
        poll_task = asyncio.create_task(poll_bms_events())
        await asyncio.sleep(0.1)
        poll_task.cancel()
        
        try:
            await poll_task
        except asyncio.CancelledError:
            pass
        
        # Verify customer polling was called
        mock_get_customers.assert_called()
    
    @pytest.mark.asyncio
    async def test_poll_error_handling(self, monkeypatch):
        """Test polling error handling"""
        # Mock bms_client to raise error
        mock_get_customers = AsyncMock(side_effect=Exception("API Error"))
        monkeypatch.setattr("src.sse_server.bms_client.get_customers", mock_get_customers)
        
        # Import and run polling function
        from src.sse_server import poll_bms_events
        
        # Run polling for a short time
        poll_task = asyncio.create_task(poll_bms_events())
        await asyncio.sleep(0.1)
        poll_task.cancel()
        
        try:
            await poll_task
        except asyncio.CancelledError:
            pass
        
        # Should not crash despite error
        assert True  # If we get here, error was handled


class TestSSEEventFiltering:
    """Test SSE event filtering"""
    
    @pytest.mark.asyncio
    async def test_filter_by_entity_type(self, test_client, auth_headers):
        """Test filtering events by entity type"""
        with patch("src.sse_server.verify_mcp_auth", return_value=True):
            # Create a queue and add it to connections
            client_queue = asyncio.Queue()
            
            with patch("src.sse_server.active_connections", {client_queue}):
                # Send events with different entity types
                await client_queue.put({
                    "entity_type": "customer",
                    "event_type": "created",
                    "data": {}
                })
                await client_queue.put({
                    "entity_type": "request",
                    "event_type": "created",
                    "data": {}
                })
                
                # Connect with customer filter
                params = {"filter_entity": "customer"}
                event_count = 0
                
                async with test_client.stream("GET", "/sse/events", headers=auth_headers, params=params) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: ") and "entity_type" in line:
                            data = json.loads(line[6:])
                            if "entity_type" in data:
                                assert data["entity_type"] == "customer"
                                event_count += 1
                                
                        if event_count >= 1:
                            break
    
    @pytest.mark.asyncio
    async def test_filter_by_event_type(self, test_client, auth_headers):
        """Test filtering events by event type"""
        with patch("src.sse_server.verify_mcp_auth", return_value=True):
            # Create a queue and add it to connections
            client_queue = asyncio.Queue()
            
            with patch("src.sse_server.active_connections", {client_queue}):
                # Send events with different event types
                await client_queue.put({
                    "entity_type": "customer",
                    "event_type": "created",
                    "data": {}
                })
                await client_queue.put({
                    "entity_type": "customer", 
                    "event_type": "updated",
                    "data": {}
                })
                
                # Connect with created filter
                params = {"filter_event": "created"}
                event_count = 0
                
                async with test_client.stream("GET", "/sse/events", headers=auth_headers, params=params) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: ") and "event_type" in line:
                            data = json.loads(line[6:])
                            if "event_type" in data:
                                assert data["event_type"] == "created"
                                event_count += 1
                                
                        if event_count >= 1:
                            break