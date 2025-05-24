from typing import Dict, Any, List, Optional
from mcp.types import Resource
from src.bms_client import bms_client
from src.logger import get_logger

logger = get_logger(__name__)


class CustomerResources:
    """Resources for reading customer data from BMS"""
    
    @staticmethod
    async def list_resources() -> List[Resource]:
        """List available customer resources"""
        return [
            Resource(
                uri="bms://customers/list",
                name="Customer List",
                description="Get a list of all customers with optional filtering",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://customers/active",
                name="Active Customers",
                description="Get a list of active customers only",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://customers/stats",
                name="Customer Statistics",
                description="Get customer statistics and analytics",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://customers/recent",
                name="Recent Customers",
                description="Get recently added or updated customers",
                mimeType="application/json"
            )
        ]
    
    @staticmethod
    async def read_resource(uri: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Read a specific customer resource"""
        if uri == "bms://customers/list":
            limit = params.get("limit", 50) if params else 50
            offset = params.get("offset", 0) if params else 0
            status = params.get("status") if params else None
            
            result = await bms_client.get_customers(limit=limit, offset=offset, status=status)
            return {
                "type": "customer_list",
                "data": result,
                "metadata": {
                    "limit": limit,
                    "offset": offset,
                    "status": status
                }
            }
            
        elif uri == "bms://customers/active":
            result = await bms_client.get_customers(limit=100, status="active")
            return {
                "type": "active_customers",
                "data": result,
                "metadata": {
                    "status": "active"
                }
            }
            
        elif uri == "bms://customers/stats":
            result = await bms_client.get_customer_stats()
            return {
                "type": "customer_statistics",
                "data": result
            }
            
        elif uri == "bms://customers/recent":
            # Get customers sorted by creation date (most recent first)
            result = await bms_client.get_customers(limit=20)
            return {
                "type": "recent_customers",
                "data": result,
                "metadata": {
                    "limit": 20
                }
            }
            
        elif uri.startswith("bms://customers/"):
            # Handle specific customer by ID
            customer_id = uri.split("/")[-1]
            result = await bms_client.get_customer(customer_id)
            return {
                "type": "customer_detail",
                "data": result
            }
            
        else:
            raise ValueError(f"Unknown customer resource: {uri}")


customer_resources = CustomerResources()