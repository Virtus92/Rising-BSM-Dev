#!/usr/bin/env python3
"""
Test script to verify MCP server setup and connections
"""

import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    
    errors = []
    
    # Test core imports
    try:
        import pydantic
        print("✓ pydantic imported successfully")
    except ImportError as e:
        errors.append(f"✗ pydantic import failed: {e}")
    
    try:
        from pydantic_settings import BaseSettings
        print("✓ pydantic_settings imported successfully")
    except ImportError as e:
        errors.append(f"✗ pydantic_settings import failed: {e}")
    
    try:
        import httpx
        print("✓ httpx imported successfully")
    except ImportError as e:
        errors.append(f"✗ httpx import failed: {e}")
    
    try:
        import fastapi
        print("✓ fastapi imported successfully")
    except ImportError as e:
        errors.append(f"✗ fastapi import failed: {e}")
    
    # Test project imports
    try:
        from src.config import settings
        print("✓ config module imported successfully")
        print(f"  - API URL: {settings.bms_api_url}")
        print(f"  - Server Port: {settings.mcp_server_port}")
        print(f"  - Allowed Origins: {settings.allowed_origins}")
    except ImportError as e:
        errors.append(f"✗ config import failed: {e}")
    except Exception as e:
        errors.append(f"✗ config error: {e}")
    
    try:
        from src.mcp_server import BMSMCPServer
        print("✓ MCP server imported successfully")
    except ImportError as e:
        errors.append(f"✗ MCP server import failed: {e}")
    
    try:
        from src.sse_server import app
        print("✓ SSE server imported successfully")
    except ImportError as e:
        errors.append(f"✗ SSE server import failed: {e}")
    
    return errors

def test_api_connection():
    """Test connection to the BMS API"""
    print("\nTesting API connection...")
    
    try:
        from src.config import settings
        import httpx
        
        print(f"Testing connection to: {settings.bms_api_url}")
        
        with httpx.Client(timeout=10.0) as client:
            # Try health endpoint first
            try:
                response = client.get(f"{settings.bms_api_url}/health")
                print(f"✓ Health endpoint: {response.status_code}")
            except:
                # Try base URL
                try:
                    response = client.get(settings.bms_api_url)
                    print(f"✓ Base URL accessible: {response.status_code}")
                except Exception as e:
                    print(f"✗ Cannot connect to API: {e}")
                    return False
        
        return True
        
    except Exception as e:
        print(f"✗ Connection test failed: {e}")
        return False

def check_environment():
    """Check environment setup"""
    print("\nChecking environment...")
    
    # Check if .env exists
    if Path(".env").exists():
        print("✓ .env file exists")
        
        # Check required variables
        from dotenv import dotenv_values
        env_vars = dotenv_values(".env")
        
        required = ["BMS_API_URL", "BMS_API_KEY"]
        for var in required:
            if var in env_vars and env_vars[var]:
                print(f"✓ {var} is set")
            else:
                print(f"✗ {var} is missing or empty")
    else:
        print("✗ .env file not found")
        print("  Run: cp .env.example .env")
        print("  Then edit .env with your configuration")

def main():
    print("Rising-BSM MCP Server Setup Test")
    print("=" * 40)
    
    # Test imports
    import_errors = test_imports()
    
    if import_errors:
        print("\nImport errors found:")
        for error in import_errors:
            print(error)
        print("\nPlease run: pip install -r requirements.txt")
        sys.exit(1)
    
    # Check environment
    check_environment()
    
    # Test API connection
    test_api_connection()
    
    print("\n" + "=" * 40)
    print("Setup test complete!")
    
    if Path(".env").exists():
        print("\nTo start the server:")
        print("  python run_sse.py")
    else:
        print("\nNext steps:")
        print("  1. Create .env file: cp .env.example .env")
        print("  2. Edit .env with your configuration")
        print("  3. Get a token: python get_token.py")
        print("  4. Start server: python run_sse.py")

if __name__ == "__main__":
    main()