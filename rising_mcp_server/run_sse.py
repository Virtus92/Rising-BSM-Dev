#!/usr/bin/env python3
"""
Main entry point for the SSE Server (for N8N integration)
"""

import uvicorn
from src.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "src.sse_server:app",
        host=settings.mcp_server_host,
        port=settings.mcp_server_port,
        reload=False,
        log_level=settings.log_level.lower()
    )