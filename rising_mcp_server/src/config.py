from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import List, Optional, Union
import os
import json


class Settings(BaseSettings):
    # BMS API Configuration
    bms_api_url: str = Field(..., description="BMS API base URL")
    bms_api_key: str = Field(..., description="BMS API authentication token")
    
    # MCP Server Configuration
    mcp_server_name: str = Field(default="bms-mcp-server")
    mcp_server_version: str = Field(default="1.0.0")
    mcp_server_host: str = Field(default="0.0.0.0")
    mcp_server_port: int = Field(default=8000)
    
    # SSE Configuration
    sse_heartbeat_interval: int = Field(default=30, description="Heartbeat interval in seconds")
    sse_client_timeout: int = Field(default=300, description="Client timeout in seconds")
    
    # Security - Handle as string in env, convert to list
    allowed_origins: Union[List[str], str] = Field(default=["*"])
    rate_limit_requests: int = Field(default=60)
    rate_limit_window: int = Field(default=60)
    
    # Logging
    log_level: str = Field(default="INFO")
    log_format: str = Field(default="json")
    
    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        """Parse allowed origins from various formats"""
        if isinstance(v, str):
            # Try to parse as JSON first
            if v.strip().startswith("["):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Otherwise split by comma
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        else:
            return ["*"]
    
    @field_validator("bms_api_url")
    @classmethod
    def validate_url(cls, v):
        if not v.startswith(("http://", "https://")):
            raise ValueError("BMS API URL must start with http:// or https://")
        return v.rstrip("/")
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"  # Ignore extra fields
    }


settings = Settings()