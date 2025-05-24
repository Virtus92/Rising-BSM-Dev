"""
Tests for logging module
"""

import pytest
import json
import logging
from unittest.mock import patch, Mock

from src.logger import JSONFormatter, setup_logger, get_logger


class TestJSONFormatter:
    """Test JSON log formatter"""
    
    def test_basic_formatting(self):
        """Test basic log formatting"""
        formatter = JSONFormatter()
        
        # Create log record
        record = logging.LogRecord(
            name="test.logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=10,
            msg="Test message",
            args=(),
            exc_info=None
        )
        
        # Format record
        output = formatter.format(record)
        data = json.loads(output)
        
        assert data["level"] == "INFO"
        assert data["logger"] == "test.logger"
        assert data["message"] == "Test message"
        assert data["module"] == "test"
        assert data["line"] == 10
        assert "timestamp" in data
    
    def test_extra_data_formatting(self):
        """Test formatting with extra data"""
        formatter = JSONFormatter()
        
        record = logging.LogRecord(
            name="test.logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=10,
            msg="Test message",
            args=(),
            exc_info=None
        )
        record.extra_data = {"user_id": "123", "action": "login"}
        
        output = formatter.format(record)
        data = json.loads(output)
        
        assert data["data"]["user_id"] == "123"
        assert data["data"]["action"] == "login"
    
    def test_exception_formatting(self):
        """Test formatting with exception"""
        formatter = JSONFormatter()
        
        try:
            raise ValueError("Test error")
        except ValueError:
            import sys
            exc_info = sys.exc_info()
        
        record = logging.LogRecord(
            name="test.logger",
            level=logging.ERROR,
            pathname="test.py",
            lineno=10,
            msg="Error occurred",
            args=(),
            exc_info=exc_info
        )
        
        output = formatter.format(record)
        data = json.loads(output)
        
        assert data["level"] == "ERROR"
        assert "exception" in data
        assert "ValueError: Test error" in data["exception"]


class TestLoggerSetup:
    """Test logger setup functions"""
    
    def test_setup_logger_json_format(self):
        """Test setting up logger with JSON format"""
        with patch("src.logger.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.log_format = "json"
            
            logger = setup_logger("test.logger")
            
            assert logger.level == logging.INFO
            assert len(logger.handlers) == 1
            assert isinstance(logger.handlers[0].formatter, JSONFormatter)
    
    def test_setup_logger_text_format(self):
        """Test setting up logger with text format"""
        with patch("src.logger.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.log_format = "text"
            
            logger = setup_logger("test.logger.text")
            
            assert logger.level == logging.DEBUG
            assert len(logger.handlers) == 1
            assert not isinstance(logger.handlers[0].formatter, JSONFormatter)
    
    def test_get_logger(self):
        """Test get_logger function"""
        with patch("src.logger.setup_logger") as mock_setup:
            mock_logger = Mock()
            mock_setup.return_value = mock_logger
            
            result = get_logger("test.module")
            
            assert result == mock_logger
            mock_setup.assert_called_once_with("test.module")
    
    def test_logger_no_duplicate_handlers(self):
        """Test that logger doesn't create duplicate handlers"""
        with patch("src.logger.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.log_format = "json"
            
            # Setup logger twice
            logger1 = setup_logger("test.duplicate")
            logger2 = setup_logger("test.duplicate")
            
            # Should be the same logger instance
            assert logger1 is logger2
            
            # Should still have only one handler
            assert len(logger1.handlers) == 1
    
    def test_logger_levels(self):
        """Test different log levels"""
        test_cases = [
            ("DEBUG", logging.DEBUG),
            ("INFO", logging.INFO),
            ("WARNING", logging.WARNING),
            ("ERROR", logging.ERROR),
            ("CRITICAL", logging.CRITICAL),
        ]
        
        for level_str, level_int in test_cases:
            with patch("src.logger.settings") as mock_settings:
                mock_settings.log_level = level_str
                mock_settings.log_format = "json"
                
                logger = setup_logger(f"test.level.{level_str}")
                assert logger.level == level_int