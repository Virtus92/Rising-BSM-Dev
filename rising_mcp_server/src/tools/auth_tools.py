from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import httpx
from mcp.types import Tool, TextContent
from pydantic import BaseModel, Field
from src.config import settings
from src.logger import get_logger

logger = get_logger(__name__)


class LoginInput(BaseModel):
    email: str = Field(..., description="Email address for BMS login")
    password: str = Field(..., description="Password for BMS login")
    save_token: bool = Field(True, description="Whether to save the token for future use")


class RefreshTokenInput(BaseModel):
    refresh_token: str = Field(..., description="Refresh token to use for getting new access token")


class ValidateTokenInput(BaseModel):
    token: str = Field(..., description="Token to validate")


class CreateServiceAccountInput(BaseModel):
    name: str = Field(..., description="Name for the service account")
    email: str = Field(..., description="Email for the service account")
    password: str = Field(..., description="Password for the service account")
    permissions: List[str] = Field(
        default=["customers:read", "customers:write", "requests:read", "requests:write", 
                "appointments:read", "appointments:write"],
        description="List of permissions to grant"
    )


class AuthTools:
    """Tools for authentication and token management in BMS"""
    
    @staticmethod
    def list_tools() -> List[Tool]:
        """List available authentication tools"""
        return [
            Tool(
                name="auth_login",
                description="Login to BMS and get access/refresh tokens",
                inputSchema=LoginInput.schema()
            ),
            Tool(
                name="auth_refresh",
                description="Refresh an access token using a refresh token",
                inputSchema=RefreshTokenInput.schema()
            ),
            Tool(
                name="auth_validate",
                description="Validate if a token is still valid",
                inputSchema=ValidateTokenInput.schema()
            ),
            Tool(
                name="auth_create_service_account",
                description="Create a new service account for automation (requires admin)",
                inputSchema=CreateServiceAccountInput.schema()
            )
        ]
    
    @staticmethod
    async def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> List[TextContent]:
        """Execute an authentication tool"""
        try:
            if tool_name == "auth_login":
                input_data = LoginInput(**arguments)
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{settings.bms_api_url}/auth/login",
                        json={
                            "email": input_data.email,
                            "password": input_data.password
                        }
                    )
                    
                    if response.status_code != 200:
                        return [TextContent(
                            type="text",
                            text=f"Login failed: {response.status_code} - {response.text}"
                        )]
                    
                    result = response.json()
                    access_token = result.get("accessToken")
                    refresh_token = result.get("refreshToken")
                    user = result.get("user", {})
                    
                    # Optionally save tokens
                    token_info = {
                        "access_token": access_token,
                        "refresh_token": refresh_token,
                        "user_id": user.get("id"),
                        "user_email": user.get("email"),
                        "user_role": user.get("role"),
                        "obtained_at": datetime.utcnow().isoformat()
                    }
                    
                    if input_data.save_token:
                        # In a production environment, you'd want to save this securely
                        # For now, we'll just return it
                        logger.info(f"Token obtained for user: {user.get('email')}")
                    
                    return [TextContent(
                        type="text",
                        text=f"Successfully logged in as {user.get('name')} ({user.get('email')})\n"
                             f"Role: {user.get('role')}\n"
                             f"Access Token: {access_token}\n"
                             f"Refresh Token: {refresh_token}\n"
                             f"\nAdd the access token to your .env file as BMS_API_KEY"
                    )]
                    
            elif tool_name == "auth_refresh":
                input_data = RefreshTokenInput(**arguments)
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{settings.bms_api_url}/auth/refresh",
                        json={"refreshToken": input_data.refresh_token}
                    )
                    
                    if response.status_code != 200:
                        return [TextContent(
                            type="text",
                            text=f"Token refresh failed: {response.status_code} - {response.text}"
                        )]
                    
                    result = response.json()
                    new_access_token = result.get("accessToken")
                    new_refresh_token = result.get("refreshToken", input_data.refresh_token)
                    
                    return [TextContent(
                        type="text",
                        text=f"Successfully refreshed token\n"
                             f"New Access Token: {new_access_token}\n"
                             f"Refresh Token: {new_refresh_token}\n"
                             f"\nUpdate your .env file with the new access token"
                    )]
                    
            elif tool_name == "auth_validate":
                input_data = ValidateTokenInput(**arguments)
                
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{settings.bms_api_url}/auth/me",
                        headers={"Authorization": f"Bearer {input_data.token}"}
                    )
                    
                    if response.status_code == 200:
                        user = response.json()
                        return [TextContent(
                            type="text",
                            text=f"Token is valid\n"
                                 f"User: {user.get('name')} ({user.get('email')})\n"
                                 f"Role: {user.get('role')}\n"
                                 f"User ID: {user.get('id')}"
                        )]
                    elif response.status_code == 401:
                        return [TextContent(
                            type="text",
                            text="Token is invalid or expired"
                        )]
                    else:
                        return [TextContent(
                            type="text",
                            text=f"Token validation failed: {response.status_code}"
                        )]
                        
            elif tool_name == "auth_create_service_account":
                input_data = CreateServiceAccountInput(**arguments)
                
                # First, we need to use the current token to create the service account
                async with httpx.AsyncClient() as client:
                    # Create user
                    create_response = await client.post(
                        f"{settings.bms_api_url}/users",
                        headers={"Authorization": f"Bearer {settings.bms_api_key}"},
                        json={
                            "name": input_data.name,
                            "email": input_data.email,
                            "password": input_data.password,
                            "role": "service_account",  # Or appropriate role
                            "permissions": input_data.permissions
                        }
                    )
                    
                    if create_response.status_code not in [200, 201]:
                        return [TextContent(
                            type="text",
                            text=f"Failed to create service account: {create_response.status_code} - {create_response.text}"
                        )]
                    
                    created_user = create_response.json()
                    
                    # Now login with the new service account to get tokens
                    login_response = await client.post(
                        f"{settings.bms_api_url}/auth/login",
                        json={
                            "email": input_data.email,
                            "password": input_data.password
                        }
                    )
                    
                    if login_response.status_code != 200:
                        return [TextContent(
                            type="text",
                            text=f"Service account created but login failed: {login_response.status_code}"
                        )]
                    
                    tokens = login_response.json()
                    
                    return [TextContent(
                        type="text",
                        text=f"Successfully created service account '{input_data.name}'\n"
                             f"User ID: {created_user.get('id')}\n"
                             f"Email: {input_data.email}\n"
                             f"Access Token: {tokens.get('accessToken')}\n"
                             f"Refresh Token: {tokens.get('refreshToken')}\n"
                             f"\nSave these tokens securely!"
                    )]
                    
            else:
                raise ValueError(f"Unknown auth tool: {tool_name}")
                
        except Exception as e:
            logger.error(f"Error executing auth tool {tool_name}: {e}")
            return [TextContent(
                type="text",
                text=f"Error executing {tool_name}: {str(e)}"
            )]


auth_tools = AuthTools()