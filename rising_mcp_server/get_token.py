#!/usr/bin/env python3
"""
Helper script to get and refresh BMS tokens
"""

import httpx
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

def login(api_url: str, email: str, password: str):
    """Login to BMS and get tokens"""
    response = httpx.post(
        f"{api_url}/auth/login",
        json={"email": email, "password": password}
    )
    
    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        sys.exit(1)
    
    return response.json()

def refresh_token(api_url: str, refresh_token: str):
    """Refresh access token using refresh token"""
    response = httpx.post(
        f"{api_url}/auth/refresh",
        json={"refreshToken": refresh_token}
    )
    
    if response.status_code != 200:
        print(f"Token refresh failed: {response.status_code}")
        return None
    
    return response.json()

def save_tokens(tokens: dict, filename: str = ".tokens.json"):
    """Save tokens to file"""
    with open(filename, "w") as f:
        json.dump({
            **tokens,
            "saved_at": datetime.utcnow().isoformat()
        }, f, indent=2)
    
    # Secure the file
    Path(filename).chmod(0o600)

def load_tokens(filename: str = ".tokens.json"):
    """Load tokens from file"""
    try:
        with open(filename, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def main():
    # Check if we have saved tokens
    saved = load_tokens()
    
    if saved and "refreshToken" in saved:
        # Try to refresh
        print("Attempting to refresh token...")
        api_url = input("BMS API URL (e.g., https://your-bms.com/api): ").rstrip("/")
        
        result = refresh_token(api_url, saved["refreshToken"])
        if result:
            print("\nToken refreshed successfully!")
            save_tokens(result)
            print(f"\nAccess Token:\n{result['accessToken']}")
            print(f"\nAdd this to your .env file as BMS_API_KEY")
            return
    
    # Need to login
    print("Please provide your BMS credentials:")
    api_url = input("BMS API URL (e.g., https://your-bms.com/api): ").rstrip("/")
    email = input("Email: ")
    
    # For security, use getpass for password
    import getpass
    password = getpass.getpass("Password: ")
    
    print("\nLogging in...")
    result = login(api_url, email, password)
    
    print("\nLogin successful!")
    save_tokens(result)
    
    print(f"\nAccess Token:\n{result['accessToken']}")
    print(f"\nRefresh Token saved to .tokens.json")
    print(f"\nAdd the access token to your .env file as BMS_API_KEY")
    
    # Show user info
    user = result.get("user", {})
    print(f"\nLogged in as: {user.get('name')} ({user.get('email')})")
    print(f"Role: {user.get('role')}")

if __name__ == "__main__":
    main()