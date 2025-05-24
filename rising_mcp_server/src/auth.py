from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
from jose import jwt, JWTError
from src.config import settings
from src.logger import get_logger

logger = get_logger(__name__)


class AuthenticationError(Exception):
    pass


class BMSAuthClient:
    def __init__(self):
        self.api_url = settings.bms_api_url
        self.api_key = settings.bms_api_key
        self._cached_user_info: Optional[Dict[str, Any]] = None
        self._cache_expiry: Optional[datetime] = None
        
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify a token against the BMS API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/auth/me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if response.status_code == 401:
                    raise AuthenticationError("Invalid or expired token")
                    
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPError as e:
            logger.error(f"Authentication verification failed: {e}")
            raise AuthenticationError(f"Failed to verify authentication: {str(e)}")
    
    async def get_service_account_info(self) -> Dict[str, Any]:
        """Get information about the service account"""
        if self._cached_user_info and self._cache_expiry and datetime.utcnow() < self._cache_expiry:
            return self._cached_user_info
            
        user_info = await self.verify_token(self.api_key)
        self._cached_user_info = user_info
        self._cache_expiry = datetime.utcnow() + timedelta(minutes=5)
        
        return user_info
    
    async def check_permission(self, resource: str, action: str) -> bool:
        """Check if the service account has a specific permission"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/permissions/check",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"resource": resource, "action": action}
                )
                
                if response.status_code == 200:
                    return response.json().get("allowed", False)
                    
                return False
                
        except Exception as e:
            logger.error(f"Permission check failed: {e}")
            return False


auth_client = BMSAuthClient()


async def verify_bearer_token(authorization: Optional[str]) -> Dict[str, Any]:
    """Verify bearer token from Authorization header"""
    if not authorization:
        raise AuthenticationError("No authorization header provided")
        
    if not authorization.startswith("Bearer "):
        raise AuthenticationError("Invalid authorization header format")
        
    token = authorization[7:]  # Remove "Bearer " prefix
    
    if not token:
        raise AuthenticationError("No token provided")
        
    return await auth_client.verify_token(token)


async def verify_mcp_auth(auth_header: Optional[str]) -> bool:
    """Verify MCP-specific authentication"""
    # For N8N integration, we can use a simple API key check
    # or integrate with BMS authentication
    if not auth_header:
        return False
        
    # Option 1: Simple API key
    if auth_header == f"Bearer {settings.bms_api_key}":
        return True
        
    # Option 2: Verify against BMS
    try:
        await verify_bearer_token(auth_header)
        return True
    except AuthenticationError:
        return False