# OpenAPI Documentation

This directory contains the OpenAPI documentation for the Rising BSM API, structured in a modular way for better maintainability.

## Directory Structure

```
openapi/
├── openapi.yaml              # Main OpenAPI specification file with references
├── README.md                 # This file
├── paths/                    # API endpoints organized by resource
│   ├── auth.yaml             # Authentication endpoints
│   ├── customers.yaml        # Customer endpoints
│   ├── projects.yaml         # Project endpoints
│   ├── appointments.yaml     # Appointment endpoints
│   ├── services.yaml         # Service endpoints
│   ├── requests.yaml         # Contact request endpoints
│   ├── profile.yaml          # User profile endpoints
│   ├── dashboard.yaml        # Dashboard endpoints
│   ├── settings.yaml         # Settings endpoints
│   ├── public.yaml           # Public endpoints
│   └── system.yaml           # System endpoints
├── schemas/                  # Reusable data models and schemas
│   ├── common.yaml           # Common data structures
│   ├── error.yaml            # Error response schemas
│   └── models.yaml           # Data models for domain entities
```

## Working with OpenAPI Files

### Adding New Endpoints

1. Find the appropriate file in the `paths` directory for your resource
2. Add your endpoint following the OpenAPI 3.0 specification
3. Reference the endpoint in the main `openapi.yaml` file

Example of adding a new endpoint:

```yaml
# In paths/example.yaml
new-endpoint:
  get:
    tags:
      - Example
    summary: Description of the endpoint
    description: More detailed description
    operationId: getExample
    responses:
      '200':
        description: Success response
        content:
          application/json:
            schema:
              $ref: '../schemas/models.yaml#/Example'
```

Then reference it in the main `openapi.yaml`:

```yaml
paths:
  # ... existing paths
  /example/new-endpoint:
    $ref: './paths/example.yaml#/new-endpoint'
```

### Adding New Models

1. Add your model to the appropriate file in the `schemas` directory
2. Reference the model in your API endpoints

Example of adding a new model:

```yaml
# In schemas/models.yaml
Example:
  type: object
  properties:
    id:
      type: integer
      description: Example ID
    name:
      type: string
      description: Example name
  required:
    - name
```

## Development Workflow

### Validating OpenAPI Spec

```bash
npm run openapi:validate
```

### Serving the Documentation Locally

```bash
npm run openapi:serve
```

This will start a local server with ReDoc UI at http://localhost:8080.

### Building a Bundled Version

```bash
npm run openapi:build
```

This will generate a bundled JSON file in the `dist` directory.

### Generating Static HTML Documentation

```bash
npm run openapi:bundle
```

This will create a standalone HTML file in the `public` directory that you can distribute.

## Best Practices

1. **Keep it DRY**: Use schema references (`$ref`) to avoid duplication
2. **Consistent naming**: Use consistent naming for paths, operations, and schemas
3. **Detailed descriptions**: Provide clear descriptions for endpoints and properties
4. **Examples**: Include examples for request and response bodies
5. **Organization**: Keep related endpoints in the same file
6. **Versioning**: Update the API version in the main file when making breaking changes