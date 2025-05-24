# Makefile for BMS MCP Server

.PHONY: help install test lint format clean run-mcp run-sse docker-build docker-run

# Default target
help:
	@echo "BMS MCP Server - Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make test         - Run tests with coverage"
	@echo "  make lint         - Run linting checks"
	@echo "  make format       - Format code"
	@echo "  make clean        - Clean cache and build files"
	@echo "  make run-mcp      - Run MCP server"
	@echo "  make run-sse      - Run SSE server"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"

# Install dependencies
install:
	pip install --upgrade pip
	pip install -r requirements.txt
	pip install -e .

# Install development dependencies
install-dev: install
	pip install pytest pytest-asyncio pytest-cov pytest-mock
	pip install flake8 black isort mypy
	pip install tox

# Run tests
test:
	pytest -v --cov=src --cov-report=term-missing --cov-report=html

# Run specific test file
test-file:
	pytest -v $(FILE)

# Run tests with markers
test-unit:
	pytest -v -m unit

test-integration:
	pytest -v -m integration

# Run linting
lint:
	flake8 src tests
	black --check src tests
	isort --check-only src tests
	mypy src || true

# Format code
format:
	black src tests
	isort src tests

# Clean cache and build files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov coverage.xml .mypy_cache .tox
	rm -rf build dist *.egg-info

# Run MCP server
run-mcp:
	@echo "Starting MCP server..."
	python run_mcp.py

# Run SSE server
run-sse:
	@echo "Starting SSE server..."
	python run_sse.py

# Run both servers (requires tmux)
run-all:
	@if command -v tmux &> /dev/null; then \
		tmux new-session -d -s mcp-servers; \
		tmux send-keys -t mcp-servers "python run_mcp.py" C-m; \
		tmux split-window -t mcp-servers -h; \
		tmux send-keys -t mcp-servers "python run_sse.py" C-m; \
		tmux attach -t mcp-servers; \
	else \
		echo "tmux not found. Please install tmux or run servers separately."; \
	fi

# Docker commands
docker-build:
	docker build -t bms-mcp-server .

docker-run:
	docker run -p 8000:8000 --env-file .env bms-mcp-server

# Development shortcuts
dev: install-dev
	@echo "Development environment ready!"

check: lint test
	@echo "All checks passed!"

# Get authentication token
get-token:
	python get_token.py

# Test connection
test-connection:
	python test_connection.py

# Watch tests (requires pytest-watch)
watch:
	@if command -v ptw &> /dev/null; then \
		ptw -- -v; \
	else \
		echo "pytest-watch not found. Install with: pip install pytest-watch"; \
	fi

# Generate coverage report
coverage:
	pytest --cov=src --cov-report=html
	@echo "Coverage report generated in htmlcov/index.html"

# Tox testing
tox:
	tox

# Create .env from example
env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created from .env.example"; \
		echo "Please edit .env with your configuration"; \
	else \
		echo ".env file already exists"; \
	fi