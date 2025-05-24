import asyncio
import json
from datetime import datetime
from typing import Dict, Any, Optional, Set
from fastapi import FastAPI, Request, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from contextlib import asynccontextmanager

from src.config import settings
from src.logger import get_logger
from src.auth import verify_mcp_auth, auth_client
from src.bms_client import bms_client

logger = get_logger(__name__)

# Store active SSE connections
active_connections: Set[asyncio.Queue] = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("Starting SSE server...")
    
    # Start event polling task
    polling_task = asyncio.create_task(poll_bms_events())
    
    yield
    
    # Shutdown
    logger.info("Shutting down SSE server...")
    polling_task.cancel()
    
    # Close all active connections
    for queue in active_connections:
        await queue.put(None)
    active_connections.clear()


app = FastAPI(
    title=f"{settings.mcp_server_name} SSE API",
    version=settings.mcp_server_version,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


async def verify_auth(authorization: Optional[str] = Header(None)):
    """Verify authentication for endpoints"""
    if not await verify_mcp_auth(authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "server": settings.mcp_server_name,
        "version": settings.mcp_server_version,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/sse/events")
async def sse_events(
    request: Request,
    authenticated: bool = Depends(verify_auth),
    filter_entity: Optional[str] = None,
    filter_event: Optional[str] = None
):
    """
    SSE endpoint for real-time BMS events
    
    Query parameters:
    - filter_entity: Filter by entity type (customer, request, appointment)
    - filter_event: Filter by event type (created, updated, deleted)
    """
    client_queue = asyncio.Queue()
    active_connections.add(client_queue)
    
    async def event_generator():
        try:
            # Send initial connection event
            yield {
                "event": "connected",
                "data": json.dumps({
                    "message": "Connected to BMS event stream",
                    "timestamp": datetime.utcnow().isoformat(),
                    "filters": {
                        "entity": filter_entity,
                        "event": filter_event
                    }
                })
            }
            
            # Send events from queue
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break
                
                try:
                    # Wait for event with timeout for heartbeat
                    event = await asyncio.wait_for(
                        client_queue.get(),
                        timeout=settings.sse_heartbeat_interval
                    )
                    
                    if event is None:  # Shutdown signal
                        break
                    
                    # Apply filters
                    if filter_entity and event.get("entity_type") != filter_entity:
                        continue
                    if filter_event and event.get("event_type") != filter_event:
                        continue
                    
                    # Send event
                    yield {
                        "event": event.get("event_type", "message"),
                        "data": json.dumps(event)
                    }
                    
                except asyncio.TimeoutError:
                    # Send heartbeat
                    yield {
                        "event": "heartbeat",
                        "data": json.dumps({
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    }
                    
        except asyncio.CancelledError:
            logger.info("SSE connection cancelled")
        except Exception as e:
            logger.error(f"Error in SSE event generator: {e}")
        finally:
            # Remove from active connections
            active_connections.discard(client_queue)
            logger.info(f"SSE client disconnected. Active connections: {len(active_connections)}")
    
    return EventSourceResponse(event_generator())


@app.post("/sse/trigger")
async def trigger_event(
    request: Request,
    authenticated: bool = Depends(verify_auth)
):
    """
    Manually trigger an event for testing
    """
    data = await request.json()
    
    event = {
        "entity_type": data.get("entity_type", "test"),
        "event_type": data.get("event_type", "test_event"),
        "entity_id": data.get("entity_id", "test-id"),
        "data": data.get("data", {}),
        "timestamp": datetime.utcnow().isoformat(),
        "source": "manual_trigger"
    }
    
    # Broadcast to all connected clients
    await broadcast_event(event)
    
    return {
        "status": "success",
        "event": event,
        "clients_notified": len(active_connections)
    }


async def broadcast_event(event: Dict[str, Any]):
    """Broadcast an event to all connected SSE clients"""
    if not active_connections:
        return
    
    # Send to all connected clients
    disconnected = []
    for queue in active_connections:
        try:
            # Non-blocking put with timeout
            await asyncio.wait_for(queue.put(event), timeout=1.0)
        except asyncio.TimeoutError:
            logger.warning("Client queue full, skipping event")
        except Exception as e:
            logger.error(f"Error broadcasting to client: {e}")
            disconnected.append(queue)
    
    # Clean up disconnected clients
    for queue in disconnected:
        active_connections.discard(queue)


async def poll_bms_events():
    """
    Poll BMS for events and broadcast them
    This is a simplified implementation - in production, you'd want to:
    1. Use webhooks from BMS to receive real-time events
    2. Store last processed timestamp/ID to avoid duplicates
    3. Implement proper error handling and retry logic
    """
    last_check = datetime.utcnow()
    
    while True:
        try:
            await asyncio.sleep(5)  # Poll every 5 seconds
            
            current_time = datetime.utcnow()
            
            # Check for new/updated customers
            customers = await bms_client.get_customers(limit=10)
            for customer in customers.get("customers", []):
                # Check if updated since last check
                updated_at = datetime.fromisoformat(
                    customer.get("updatedAt", customer.get("createdAt")).replace("Z", "+00:00")
                )
                if updated_at > last_check:
                    event = {
                        "entity_type": "customer",
                        "event_type": "updated" if customer.get("createdAt") != customer.get("updatedAt") else "created",
                        "entity_id": customer["id"],
                        "data": {
                            "id": customer["id"],
                            "name": customer.get("name"),
                            "email": customer.get("email"),
                            "status": customer.get("status")
                        },
                        "timestamp": current_time.isoformat(),
                        "source": "polling"
                    }
                    await broadcast_event(event)
            
            # Check for new/updated requests
            requests = await bms_client.get_requests(limit=10)
            for request in requests.get("requests", []):
                updated_at = datetime.fromisoformat(
                    request.get("updatedAt", request.get("createdAt")).replace("Z", "+00:00")
                )
                if updated_at > last_check:
                    event = {
                        "entity_type": "request",
                        "event_type": "updated" if request.get("createdAt") != request.get("updatedAt") else "created",
                        "entity_id": request["id"],
                        "data": {
                            "id": request["id"],
                            "subject": request.get("subject"),
                            "status": request.get("status"),
                            "assignedTo": request.get("assignedTo"),
                            "customerId": request.get("customerId")
                        },
                        "timestamp": current_time.isoformat(),
                        "source": "polling"
                    }
                    await broadcast_event(event)
            
            # Check for new/updated appointments
            appointments = await bms_client.get_appointments(limit=10)
            for appointment in appointments.get("appointments", []):
                updated_at = datetime.fromisoformat(
                    appointment.get("updatedAt", appointment.get("createdAt")).replace("Z", "+00:00")
                )
                if updated_at > last_check:
                    event = {
                        "entity_type": "appointment",
                        "event_type": "updated" if appointment.get("createdAt") != appointment.get("updatedAt") else "created",
                        "entity_id": appointment["id"],
                        "data": {
                            "id": appointment["id"],
                            "title": appointment.get("title"),
                            "status": appointment.get("status"),
                            "scheduledAt": appointment.get("scheduledAt"),
                            "customerId": appointment.get("customerId")
                        },
                        "timestamp": current_time.isoformat(),
                        "source": "polling"
                    }
                    await broadcast_event(event)
            
            last_check = current_time
            
        except Exception as e:
            logger.error(f"Error polling BMS events: {e}")
            await asyncio.sleep(30)  # Wait longer on error


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": settings.mcp_server_name,
        "version": settings.mcp_server_version,
        "endpoints": {
            "health": "/health",
            "sse_events": "/sse/events",
            "trigger_event": "/sse/trigger (POST)",
            "docs": "/docs"
        },
        "authentication": "Bearer token in Authorization header",
        "active_connections": len(active_connections)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.sse_server:app",
        host=settings.mcp_server_host,
        port=settings.mcp_server_port,
        reload=True
    )