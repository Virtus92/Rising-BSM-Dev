#!/usr/bin/env python3
"""
Test script to verify MCP server connection and authentication
"""

import httpx
import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BMS_API_URL = os.getenv("BMS_API_URL")
BMS_API_KEY = os.getenv("BMS_API_KEY")


async def test_bms_connection():
    """Test direct connection to BMS API"""
    print("1. Testing BMS API connection...")
    
    if not BMS_API_URL:
        print("   ❌ BMS_API_URL not set in .env")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BMS_API_URL}/health")
            if response.status_code == 200:
                print(f"   ✅ BMS API is reachable at {BMS_API_URL}")
                return True
            else:
                print(f"   ❌ BMS API returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ Failed to connect to BMS API: {e}")
        return False


async def test_authentication():
    """Test authentication with provided token"""
    print("\n2. Testing authentication...")
    
    if not BMS_API_KEY:
        print("   ❌ BMS_API_KEY not set in .env")
        print("   💡 Run 'python get_token.py' to get a token")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BMS_API_URL}/auth/me",
                headers={"Authorization": f"Bearer {BMS_API_KEY}"}
            )
            
            if response.status_code == 200:
                user = response.json()
                print(f"   ✅ Authenticated as: {user.get('name')} ({user.get('email')})")
                print(f"   ✅ Role: {user.get('role')}")
                return True
            elif response.status_code == 401:
                print("   ❌ Token is invalid or expired")
                print("   💡 Run 'python get_token.py' to get a new token")
                return False
            else:
                print(f"   ❌ Authentication failed with status {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ Authentication error: {e}")
        return False


async def test_permissions():
    """Test if token has required permissions"""
    print("\n3. Testing permissions...")
    
    required_permissions = [
        ("customers", "read"),
        ("customers", "write"),
        ("requests", "read"),
        ("requests", "write"),
        ("appointments", "read"),
        ("appointments", "write")
    ]
    
    all_good = True
    
    for resource, action in required_permissions:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{BMS_API_URL}/permissions/check",
                    headers={"Authorization": f"Bearer {BMS_API_KEY}"},
                    json={"resource": resource, "action": action}
                )
                
                if response.status_code == 200:
                    allowed = response.json().get("allowed", False)
                    if allowed:
                        print(f"   ✅ Permission: {resource}:{action}")
                    else:
                        print(f"   ❌ Missing permission: {resource}:{action}")
                        all_good = False
                else:
                    print(f"   ⚠️  Could not check permission: {resource}:{action}")
        except Exception as e:
            print(f"   ⚠️  Error checking permissions: {e}")
    
    return all_good


async def test_sse_server():
    """Test if SSE server is running"""
    print("\n4. Testing SSE server...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8000/health")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SSE server is running")
                print(f"   ✅ Version: {data.get('version')}")
                return True
            else:
                print(f"   ❌ SSE server returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ SSE server not running at http://localhost:8000")
        print(f"   💡 Start it with: python run_sse.py")
        return False


async def main():
    """Run all tests"""
    print("BMS MCP Server Connection Test")
    print("==============================")
    
    results = []
    
    # Test BMS connection
    results.append(await test_bms_connection())
    
    # Test authentication
    if results[0]:  # Only if BMS is reachable
        results.append(await test_authentication())
        
        # Test permissions
        if results[1]:  # Only if authenticated
            results.append(await test_permissions())
    
    # Test SSE server
    results.append(await test_sse_server())
    
    # Summary
    print("\n" + "="*40)
    print("SUMMARY")
    print("="*40)
    
    if all(results):
        print("✅ All tests passed! Your MCP server is ready to use.")
        print("\nNext steps:")
        print("1. Configure N8N to connect to http://localhost:8000/sse/events")
        print("2. Use the Bearer token from your .env file")
        print("3. Start building your automation workflows!")
        return 0
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)