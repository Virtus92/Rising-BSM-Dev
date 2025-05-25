#!/usr/bin/env python3
"""
Helper script to get and refresh BMS tokens with improved error handling
"""

import httpx
import json
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
import getpass


class TokenManager:
    def __init__(self, timeout: int = 30):
        self.timeout = httpx.Timeout(timeout, connect=10.0)
        self.tokens_file = ".tokens.json"
    
    def login(self, api_url: str, email: str, password: str) -> dict:
        """Login to BMS and get tokens with retry logic"""
        max_retries = 3
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                print(f"Attempting to connect to {api_url}/auth/login...")
                
                with httpx.Client(timeout=self.timeout) as client:
                    response = client.post(
                        f"{api_url}/auth/login",
                        json={"email": email, "password": password},
                        headers={
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        }
                    )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Login failed: {response.status_code}")
                    print(f"Response: {response.text}")
                    
                    if response.status_code == 401:
                        print("Invalid credentials. Please check your email and password.")
                        sys.exit(1)
                    elif response.status_code >= 500:
                        print("Server error. The server might be down.")
                    
            except httpx.TimeoutException:
                print(f"Connection timeout (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                else:
                    print("\nConnection failed after multiple attempts.")
                    print("Possible causes:")
                    print("1. The server is not running or not accessible")
                    print("2. The API URL is incorrect")
                    print("3. Network/firewall issues")
                    print("4. The server is taking too long to respond")
                    sys.exit(1)
                    
            except httpx.ConnectError as e:
                print(f"Connection error: Cannot connect to {api_url}")
                print(f"Error: {str(e)}")
                print("\nPlease verify:")
                print("1. The API URL is correct")
                print("2. The server is running")
                print("3. You have internet connectivity")
                sys.exit(1)
                
            except Exception as e:
                print(f"Unexpected error: {type(e).__name__}: {str(e)}")
                sys.exit(1)
        
        print("Login failed after all retries.")
        sys.exit(1)
    
    def refresh_token(self, api_url: str, refresh_token: str) -> dict:
        """Refresh access token using refresh token"""
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    f"{api_url}/auth/refresh",
                    json={"refreshToken": refresh_token},
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Token refresh failed: {response.status_code}")
                return None
                
        except httpx.TimeoutException:
            print("Token refresh timeout")
            return None
        except Exception as e:
            print(f"Token refresh error: {str(e)}")
            return None
    
    def save_tokens(self, tokens: dict):
        """Save tokens to file"""
        # If response is wrapped in data, preserve the structure
        save_data = tokens if 'data' not in tokens else tokens
        
        with open(self.tokens_file, "w") as f:
            json.dump({
                **save_data,
                "saved_at": datetime.utcnow().isoformat()
            }, f, indent=2)
        
        # Secure the file
        Path(self.tokens_file).chmod(0o600)
        print(f"Tokens saved to {self.tokens_file}")
    
    def load_tokens(self) -> dict:
        """Load tokens from file"""
        try:
            with open(self.tokens_file, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return None
    
    def test_connection(self, api_url: str) -> bool:
        """Test if the API is reachable"""
        try:
            print(f"Testing connection to {api_url}...")
            with httpx.Client(timeout=httpx.Timeout(10.0)) as client:
                response = client.get(f"{api_url}/health", follow_redirects=True)
                
                if response.status_code == 200:
                    print("✓ API is reachable")
                    return True
                else:
                    print(f"API returned status code: {response.status_code}")
                    return True  # API is reachable even if health endpoint doesn't exist
                    
        except httpx.TimeoutException:
            print("✗ Connection timeout")
            return False
        except httpx.ConnectError:
            print("✗ Cannot connect to API")
            return False
        except Exception as e:
            print(f"✗ Connection test failed: {str(e)}")
            return False


def main():
    token_manager = TokenManager()
    
    # Check if we have saved tokens
    saved = token_manager.load_tokens()
    
    if saved:
        # Check for refresh token in various possible locations
        refresh_token = saved.get('refreshToken') or \
                       saved.get('data', {}).get('refreshToken')
        # Try to refresh
        print("Found saved tokens. Attempting to refresh...")
        api_url = input("BMS API URL (e.g., https://your-bms.com/api): ").rstrip("/")
        
        # Test connection first
        if not token_manager.test_connection(api_url):
            print("\nCannot connect to the API. Please check the URL and try again.")
            sys.exit(1)
        
        if refresh_token:
            result = token_manager.refresh_token(api_url, refresh_token)
        if result:
            print("\n✓ Token refreshed successfully!")
            token_manager.save_tokens(result)
            # Extract data from response
            data = result.get('data', result)
            access_token = data.get('accessToken')
            
            if not access_token:
                print("Error: No access token in refresh response")
                print(f"Response structure: {json.dumps(result, indent=2)}")
                return
            
            print(f"\nAccess Token:\n{access_token}")
            print(f"\nAdd this to your .env file as BMS_API_KEY")
            return
        else:
            print("Token refresh failed. Please login again.")
    
    # Need to login
    print("\nBMS Authentication Setup")
    print("-" * 40)
    
    # Get API URL
    api_url = input("BMS API URL (e.g., https://your-bms.com/api): ").rstrip("/")
    
    # Test connection
    if not token_manager.test_connection(api_url):
        print("\nCannot connect to the API.")
        print("Please verify the URL and ensure the server is running.")
        sys.exit(1)
    
    # Get credentials
    email = input("Email: ")
    password = getpass.getpass("Password: ")
    
    print("\nLogging in...")
    result = token_manager.login(api_url, email, password)
    
    print("\n✓ Login successful!")
    token_manager.save_tokens(result)
    
    # Extract data from response
    data = result.get('data', result)  # Handle both wrapped and unwrapped responses
    access_token = data.get('accessToken')
    refresh_token = data.get('refreshToken')
    
    if not access_token:
        print("Error: No access token in response")
        print(f"Response structure: {json.dumps(result, indent=2)}")
        sys.exit(1)
    
    print(f"\nAccess Token:\n{access_token}")
    print(f"\nRefresh Token saved to {token_manager.tokens_file}")
    print(f"\nAdd the access token to your .env file as BMS_API_KEY")
    
    # Show user info
    user = data.get("user", {})
    if user:
        print(f"\nLogged in as: {user.get('name', 'Unknown')} ({user.get('email', 'Unknown')})")
        print(f"Role: {user.get('role', 'Unknown')}")
    
    print("\nNext steps:")
    print("1. Copy the access token above")
    print("2. Open your .env file")
    print("3. Set BMS_API_KEY=<your-access-token>")
    print("4. Save the .env file")
    print("5. Run 'python run_sse.py' to start the SSE server")


if __name__ == "__main__":
    main()