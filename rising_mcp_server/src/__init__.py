"""
BMS MCP Server Package

A Model Context Protocol server for integrating N8N AI Agents with 
Business Management System (BMS).
"""

__version__ = "1.0.0"
__author__ = "Dinel"

from src.mcp_server import BMSMCPServer
from src.sse_server import app as sse_app

__all__ = ["BMSMCPServer", "sse_app"]