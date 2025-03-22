#!/bin/sh
set -e

# Configure Swagger based on environment variables
if [ "$SWAGGER_ENABLED" = "true" ]; then
  echo "Enabling Swagger documentation..."
  export SWAGGER_ENABLED=true
else
  echo "Swagger documentation disabled"
  export SWAGGER_ENABLED=false
fi

# Pass all arguments to the command
exec "$@"
