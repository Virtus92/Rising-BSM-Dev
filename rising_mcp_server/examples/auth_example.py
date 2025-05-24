#!/usr/bin/env python3
"""
Example of how to authenticate and use the BMS MCP Server
"""

import asyncio
import httpx
import json
from datetime import datetime

# Configuration
MCP_SERVER_URL = "http://localhost:8000"
BMS_EMAIL = "your-email@example.com"
BMS_PASSWORD = "your-password"


async def get_token():
    """Get authentication token from BMS"""
    async with httpx.AsyncClient() as client:
        # Call the MCP auth_login tool
        response = await client.post(
            f"{MCP_SERVER_URL}/mcp/tools/auth_login",
            json={
                "email": BMS_EMAIL,
                "password": BMS_PASSWORD,
                "save_token": True
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            # Extract token from the response text
            # In a real implementation, the tool would return structured data
            print("Login successful!")
            print(result)
            return result
        else:
            print(f"Login failed: {response.status_code}")
            return None


async def listen_to_events(token: str):
    """Listen to SSE events"""
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "GET",
            f"{MCP_SERVER_URL}/sse/events",
            headers=headers,
            params={"filter_entity": "request", "filter_event": "created"}
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    try:
                        data = json.loads(line[6:])
                        print(f"Event received: {data}")
                        
                        # Process the event
                        if data.get("entity_type") == "request" and data.get("event_type") == "created":
                            await process_new_request(token, data)
                    except json.JSONDecodeError:
                        pass


async def process_new_request(token: str, event_data: dict):
    """Process a new request event"""
    request_id = event_data["data"]["id"]
    print(f"Processing new request: {request_id}")
    
    # Example: Auto-assign to first available user
    async with httpx.AsyncClient() as client:
        # Get available users
        users_response = await client.get(
            f"{MCP_SERVER_URL}/mcp/resources/bms://users/active",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if users_response.status_code == 200:
            users_data = users_response.json()
            if users_data.get("data", {}).get("users"):
                first_user = users_data["data"]["users"][0]
                
                # Assign the request
                assign_response = await client.post(
                    f"{MCP_SERVER_URL}/mcp/tools/request_assign",
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "request_id": request_id,
                        "user_id": first_user["id"],
                        "note": f"Auto-assigned by MCP automation at {datetime.utcnow().isoformat()}"
                    }
                )
                
                if assign_response.status_code == 200:
                    print(f"Successfully assigned request {request_id} to {first_user['name']}")
                else:
                    print(f"Failed to assign request: {assign_response.status_code}")


async def main():
    """Main function"""
    print("BMS MCP Server Authentication Example")
    print("=====================================")
    
    # Get authentication token
    token_result = await get_token()
    
    if token_result:
        # Extract token from result
        # This is a simplified example - in practice, you'd parse the actual token
        token = "YOUR_ACCESS_TOKEN_HERE"
        
        print("\nListening for events...")
        print("Press Ctrl+C to stop")
        
        try:
            await listen_to_events(token)
        except KeyboardInterrupt:
            print("\nStopping event listener...")


if __name__ == "__main__":
    asyncio.run(main())