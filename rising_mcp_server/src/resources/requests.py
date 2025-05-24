from typing import Dict, Any, List, Optional
from mcp.types import Resource
from src.bms_client import bms_client
from src.logger import get_logger

logger = get_logger(__name__)


class RequestResources:
    """Resources for reading service request data from BMS"""
    
    @staticmethod
    async def list_resources() -> List[Resource]:
        """List available request resources"""
        return [
            Resource(
                uri="bms://requests/list",
                name="Request List",
                description="Get a list of all service requests with optional filtering",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://requests/pending",
                name="Pending Requests",
                description="Get unassigned or pending service requests",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://requests/assigned",
                name="Assigned Requests",
                description="Get service requests that are assigned to users",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://requests/my-assigned",
                name="My Assigned Requests",
                description="Get requests assigned to the current service account",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://requests/open",
                name="Open Requests",
                description="Get all open (non-completed) service requests",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://requests/stats",
                name="Request Statistics",
                description="Get request statistics and analytics",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://requests/by-status",
                name="Requests by Status",
                description="Get requests grouped by their status",
                mimeType="application/json"
            )
        ]
    
    @staticmethod
    async def read_resource(uri: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Read a specific request resource"""
        if uri == "bms://requests/list":
            limit = params.get("limit", 50) if params else 50
            offset = params.get("offset", 0) if params else 0
            status = params.get("status") if params else None
            assigned_to = params.get("assigned_to") if params else None
            
            result = await bms_client.get_requests(
                limit=limit, 
                offset=offset, 
                status=status,
                assigned_to=assigned_to
            )
            return {
                "type": "request_list",
                "data": result,
                "metadata": {
                    "limit": limit,
                    "offset": offset,
                    "status": status,
                    "assigned_to": assigned_to
                }
            }
            
        elif uri == "bms://requests/pending":
            result = await bms_client.get_requests(limit=100, assigned=False, status="pending")
            return {
                "type": "pending_requests",
                "data": result,
                "metadata": {
                    "assigned": False,
                    "status": "pending"
                }
            }
            
        elif uri == "bms://requests/assigned":
            result = await bms_client.get_requests(limit=100, assigned=True)
            return {
                "type": "assigned_requests",
                "data": result,
                "metadata": {
                    "assigned": True
                }
            }
            
        elif uri == "bms://requests/my-assigned":
            # Get service account info to find assigned requests
            from src.auth import auth_client
            user_info = await auth_client.get_service_account_info()
            user_id = user_info.get("id")
            
            result = await bms_client.get_requests(limit=100, assigned_to=user_id)
            return {
                "type": "my_assigned_requests",
                "data": result,
                "metadata": {
                    "assigned_to": user_id
                }
            }
            
        elif uri == "bms://requests/open":
            # Get all non-completed requests
            open_statuses = ["pending", "in_progress", "assigned"]
            all_open = {"requests": [], "total": 0}
            
            for status in open_statuses:
                result = await bms_client.get_requests(limit=50, status=status)
                all_open["requests"].extend(result.get("requests", []))
                all_open["total"] += result.get("total", 0)
            
            return {
                "type": "open_requests",
                "data": all_open,
                "metadata": {
                    "statuses": open_statuses
                }
            }
            
        elif uri == "bms://requests/stats":
            result = await bms_client.get_request_stats()
            return {
                "type": "request_statistics",
                "data": result
            }
            
        elif uri == "bms://requests/by-status":
            # Get requests grouped by status
            statuses = ["pending", "assigned", "in_progress", "completed", "cancelled"]
            grouped = {}
            
            for status in statuses:
                result = await bms_client.get_requests(limit=20, status=status)
                grouped[status] = result
            
            return {
                "type": "requests_by_status",
                "data": grouped,
                "metadata": {
                    "statuses": statuses
                }
            }
            
        elif uri.startswith("bms://requests/"):
            # Handle specific request by ID
            request_id = uri.split("/")[-1]
            result = await bms_client.get_request(request_id)
            return {
                "type": "request_detail",
                "data": result
            }
            
        else:
            raise ValueError(f"Unknown request resource: {uri}")


request_resources = RequestResources()