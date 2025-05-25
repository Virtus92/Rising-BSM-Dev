# Rising-BSM MCP Server - Troubleshooting Guide

## Quick Fix Summary

The main issues you encountered have been resolved:

1. **Created `pyproject.toml`** - The project can now be installed as a Python package
2. **Fixed `src/config.py`** - Improved parsing of environment variables
3. **Enhanced `get_token.py`** - Better error handling and connection testing
4. **Created setup test script** - `test_setup.py` to verify your installation

## Setup Instructions

### 1. Install the Project

```bash
# Option 1: Install as editable package (recommended for development)
pip install -e .

# Option 2: Just install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the template
cp .env.template .env

# Edit .env with your configuration
# For local development, use:
# BMS_API_URL=http://localhost:3000/api
```

### 3. Test Your Setup

```bash
# Run the setup test
python test_setup.py
```

This will check:
- All required packages are installed
- Configuration is loaded correctly
- API connection is working

### 4. Get Authentication Token

```bash
# If using remote API (https://dinel.at/api)
python get_token.py

# If API is not accessible, start local Rising-BSM first:
cd ../app
npm run dev
# Then use http://localhost:3000/api in get_token.py
```

### 5. Start the Server

```bash
# Start SSE server for N8N integration
python run_sse.py

# Or start MCP server
python run_mcp.py
```

## Common Issues and Solutions

### Issue 1: ModuleNotFoundError: No module named 'src'

**Solution:**
```bash
# Make sure you're in the rising_mcp_server directory
cd C:\Rising-BSM\rising_mcp_server

# Install the project
pip install -e .
```

### Issue 2: JSON Decode Error for allowed_origins

**Solution:**
The config has been updated to handle this. Make sure your `.env` file uses comma-separated values:
```
ALLOWED_ORIGINS=http://localhost:*,https://n8n.your-domain.com
```

**NOT:**
```
ALLOWED_ORIGINS=["http://localhost:*","https://n8n.your-domain.com"]
```

### Issue 3: Connection Timeout to https://dinel.at/api

**Possible Solutions:**

1. **Use local Rising-BSM server:**
   ```bash
   # Start local server
   cd C:\Rising-BSM\app
   npm run dev
   
   # Update .env
   BMS_API_URL=http://localhost:3000/api
   ```

2. **Check if server is running:**
   ```bash
   curl -I https://dinel.at/api/health
   ```

3. **Check firewall/proxy settings**

4. **Increase timeout in get_token.py** (already implemented in the updated version)

### Issue 4: pydantic_settings import errors

**Solution:**
Make sure you have the correct version:
```bash
pip install "pydantic>=2.0.0" "pydantic-settings>=2.0.0"
```

## Testing Connection

### Manual API Test

```python
import httpx

# Test remote API
response = httpx.get("https://dinel.at/api/health", timeout=30)
print(f"Status: {response.status_code}")

# Test local API
response = httpx.get("http://localhost:3000/api/health", timeout=30)
print(f"Status: {response.status_code}")
```

### Using the Test Script

```bash
python test_setup.py
```

## Development Tips

### 1. Enable Debug Logging

In `.env`:
```
LOG_LEVEL=DEBUG
```

### 2. Use Local Development

For easier development, use the local Rising-BSM server:
1. Start the Next.js app: `npm run dev` in the app directory
2. Use `http://localhost:3000/api` as your API URL
3. Create a local admin account
4. Generate a token using the web interface or API

### 3. Virtual Environment

Always use a virtual environment:
```bash
# Create venv
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 4. Check Dependencies

```bash
# List installed packages
pip list

# Check for missing dependencies
pip check
```

## N8N Integration

Once the server is running:

1. **SSE Endpoint**: `http://localhost:8000/sse/events`
2. **Authentication**: Bearer token in Authorization header
3. **Test with curl**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/sse/events
   ```

## Need More Help?

1. Check server logs for detailed error messages
2. Run `python test_setup.py` to diagnose issues
3. Verify all environment variables are set correctly
4. Ensure the Rising-BSM API is accessible from your machine

## File Structure

```
rising_mcp_server/
├── pyproject.toml          # Project configuration (NEW)
├── .env.template           # Environment template (NEW)
├── test_setup.py           # Setup verification script (NEW)
├── get_token.py            # Token helper (UPDATED)
├── src/
│   └── config.py           # Configuration (UPDATED)
└── ... (other files)
```