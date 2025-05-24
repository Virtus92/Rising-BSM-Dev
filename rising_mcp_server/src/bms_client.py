import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime
from src.config import settings
from src.logger import get_logger
from src.auth import auth_client

logger = get_logger(__name__)


class BMSAPIError(Exception):
    pass


class BMSClient:
    def __init__(self):
        self.base_url = settings.bms_api_url
        self.headers = {
            "Authorization": f"Bearer {settings.bms_api_key}",
            "Content-Type": "application/json"
        }
        
    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make an authenticated request to the BMS API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    **kwargs
                )
                
                if response.status_code >= 400:
                    error_data = response.json() if response.content else {}
                    raise BMSAPIError(
                        f"BMS API error ({response.status_code}): {error_data.get('message', 'Unknown error')}"
                    )
                
                return response.json()
                
        except httpx.HTTPError as e:
            logger.error(f"BMS API request failed: {e}")
            raise BMSAPIError(f"Failed to communicate with BMS API: {str(e)}")
    
    # Customer Methods
    async def get_customers(self, limit: int = 50, offset: int = 0, status: Optional[str] = None) -> Dict[str, Any]:
        """Get list of customers with optional filtering"""
        params = {"limit": limit, "offset": offset}
        if status:
            params["status"] = status
        return await self._request("GET", "/customers", params=params)
    
    async def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """Get specific customer details"""
        return await self._request("GET", f"/customers/{customer_id}")
    
    async def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new customer"""
        return await self._request("POST", "/customers", json=customer_data)
    
    async def update_customer(self, customer_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update customer information"""
        return await self._request("PATCH", f"/customers/{customer_id}", json=update_data)
    
    async def add_customer_note(self, customer_id: str, note: str) -> Dict[str, Any]:
        """Add a note to a customer"""
        return await self._request("POST", f"/customers/{customer_id}/notes", json={"content": note})
    
    async def get_customer_stats(self) -> Dict[str, Any]:
        """Get customer statistics"""
        return await self._request("GET", "/customers/stats")
    
    # Request Methods
    async def get_requests(self, limit: int = 50, offset: int = 0, 
                          status: Optional[str] = None, 
                          assigned: Optional[bool] = None,
                          assigned_to: Optional[str] = None) -> Dict[str, Any]:
        """Get list of requests with optional filtering"""
        params = {"limit": limit, "offset": offset}
        if status:
            params["status"] = status
        if assigned is not None:
            params["assigned"] = assigned
        if assigned_to:
            params["assignedTo"] = assigned_to
        return await self._request("GET", "/requests", params=params)
    
    async def get_request(self, request_id: str) -> Dict[str, Any]:
        """Get specific request details"""
        return await self._request("GET", f"/requests/{request_id}")
    
    async def create_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new request"""
        return await self._request("POST", "/requests", json=request_data)
    
    async def update_request(self, request_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update request information"""
        return await self._request("PATCH", f"/requests/{request_id}", json=update_data)
    
    async def assign_request(self, request_id: str, user_id: str) -> Dict[str, Any]:
        """Assign a request to a user"""
        return await self._request("POST", f"/requests/{request_id}/assign", json={"userId": user_id})
    
    async def convert_request_to_appointment(self, request_id: str, appointment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert a request to an appointment"""
        return await self._request("POST", f"/requests/{request_id}/convert", json=appointment_data)
    
    async def get_request_stats(self) -> Dict[str, Any]:
        """Get request statistics"""
        return await self._request("GET", "/requests/stats")
    
    # Appointment Methods
    async def get_appointments(self, limit: int = 50, offset: int = 0,
                             status: Optional[str] = None,
                             upcoming: Optional[bool] = None) -> Dict[str, Any]:
        """Get list of appointments with optional filtering"""
        params = {"limit": limit, "offset": offset}
        if status:
            params["status"] = status
        if upcoming:
            params["upcoming"] = upcoming
        return await self._request("GET", "/appointments", params=params)
    
    async def get_appointment(self, appointment_id: str) -> Dict[str, Any]:
        """Get specific appointment details"""
        return await self._request("GET", f"/appointments/{appointment_id}")
    
    async def create_appointment(self, appointment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new appointment"""
        return await self._request("POST", "/appointments", json=appointment_data)
    
    async def update_appointment(self, appointment_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update appointment information"""
        return await self._request("PATCH", f"/appointments/{appointment_id}", json=update_data)
    
    async def cancel_appointment(self, appointment_id: str, reason: str) -> Dict[str, Any]:
        """Cancel an appointment"""
        return await self._request("POST", f"/appointments/{appointment_id}/cancel", json={"reason": reason})
    
    async def get_appointment_stats(self) -> Dict[str, Any]:
        """Get appointment statistics"""
        return await self._request("GET", "/appointments/stats")
    
    # User Methods
    async def get_users(self, active_only: bool = True) -> Dict[str, Any]:
        """Get list of users"""
        params = {"activeOnly": active_only}
        return await self._request("GET", "/users", params=params)
    
    async def get_user(self, user_id: str) -> Dict[str, Any]:
        """Get specific user details"""
        return await self._request("GET", f"/users/{user_id}")
    
    # Dashboard Methods
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get dashboard statistics"""
        stats = {}
        
        # Gather all stats concurrently
        customer_stats = await self.get_customer_stats()
        request_stats = await self.get_request_stats()
        appointment_stats = await self.get_appointment_stats()
        
        return {
            "customers": customer_stats,
            "requests": request_stats,
            "appointments": appointment_stats,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Automation Methods
    async def create_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new automation webhook"""
        return await self._request("POST", "/automation/webhooks", json=webhook_data)
    
    async def trigger_webhook(self, webhook_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Manually trigger a webhook"""
        return await self._request("POST", f"/automation/webhooks/{webhook_id}/trigger", json=payload)
    
    async def create_scheduled_task(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new scheduled task"""
        return await self._request("POST", "/automation/schedules", json=schedule_data)
    
    async def get_automation_executions(self, limit: int = 50) -> Dict[str, Any]:
        """Get automation execution history"""
        return await self._request("GET", "/automation/executions", params={"limit": limit})


bms_client = BMSClient()