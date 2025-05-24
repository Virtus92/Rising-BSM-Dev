"""
BMS MCP Resources

Resources provide read-only access to BMS data.
"""

from src.resources.customers import customer_resources
from src.resources.requests import request_resources
from src.resources.appointments import appointment_resources
from src.resources.dashboard import dashboard_resources

__all__ = [
    "customer_resources",
    "request_resources", 
    "appointment_resources",
    "dashboard_resources"
]