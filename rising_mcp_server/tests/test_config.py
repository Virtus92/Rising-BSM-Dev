"""
Tests for configuration module
"""

import pytest
import os
from unittest.mock import patch

from src.config import Settings


class TestSettings:
    """Test Settings configuration"""
    
    def test_default_settings(self):
        """Test settings with defaults"""
        with patch.dict(os.environ, {
            "BMS_API_URL": "https://test.com/api",
            "BMS_API_KEY": "test-key"
        }):
            settings = Settings()
            
            assert settings.bms_api_url == "https://test.com/api"
            assert settings.bms_api_key == "test-key"
            assert settings.mcp_server_name == "bms-mcp-server"
            assert settings.mcp_server_port == 8000
            assert settings.sse_heartbeat_interval == 30
    
    def test_custom_settings(self):
        """Test settings with custom values"""
        with patch.dict(os.environ, {
            "BMS_API_URL": "https://custom.com/api",
            "BMS_API_KEY": "custom-key",
            "MCP_SERVER_NAME": "custom-server",
            "MCP_SERVER_PORT": "9000",
            "SSE_HEARTBEAT_INTERVAL": "60"
        }):
            settings = Settings()
            
            assert settings.mcp_server_name == "custom-server"
            assert settings.mcp_server_port == 9000
            assert settings.sse_heartbeat_interval == 60
    
    def test_url_validation(self):
        """Test URL validation"""
        with patch.dict(os.environ, {
            "BMS_API_KEY": "test-key"
        }):
            # Test invalid URL
            with pytest.raises(ValueError, match="BMS API URL must start with http"):
                Settings(bms_api_url="invalid-url")
            
            # Test URL trailing slash removal
            settings = Settings(bms_api_url="https://test.com/api/")
            assert settings.bms_api_url == "https://test.com/api"
    
    def test_origins_parsing(self):
        """Test allowed origins parsing"""
        with patch.dict(os.environ, {
            "BMS_API_URL": "https://test.com/api",
            "BMS_API_KEY": "test-key",
            "ALLOWED_ORIGINS": "http://localhost:3000,https://app.example.com"
        }):
            settings = Settings()
            
            assert len(settings.allowed_origins) == 2
            assert "http://localhost:3000" in settings.allowed_origins
            assert "https://app.example.com" in settings.allowed_origins
    
    def test_missing_required_fields(self):
        """Test missing required fields"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError):
                Settings()
    
    def test_env_file_loading(self, tmp_path):
        """Test loading from .env file"""
        # Create temporary .env file
        env_file = tmp_path / ".env"
        env_file.write_text("""
BMS_API_URL=https://env-file.com/api
BMS_API_KEY=env-file-key
LOG_LEVEL=DEBUG
""")
        
        # Change to temp directory
        original_cwd = os.getcwd()
        try:
            os.chdir(tmp_path)
            settings = Settings()
            
            assert settings.bms_api_url == "https://env-file.com/api"
            assert settings.bms_api_key == "env-file-key"
            assert settings.log_level == "DEBUG"
        finally:
            os.chdir(original_cwd)