export default {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Rising BSM API',
        version: '1.0.0',
        description: 'Backend API for Rising Business Service Management',
        contact: {
          name: 'API Support',
          email: 'support@example.com'
        }
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        parameters: {
          pageParam: {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1
            }
          },
          limitParam: {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: {
              type: 'integer',
              default: 20
            }
          },
          searchParam: {
            name: 'search',
            in: 'query',
            description: 'Search term',
            schema: {
              type: 'string'
            }
          }
        },
        responses: {
          UnauthorizedError: {
            description: 'Access token is missing or invalid',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: false
                    },
                    error: {
                      type: 'string',
                      example: 'Unauthorized access'
                    }
                  }
                }
              }
            }
          },
          NotFoundError: {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: false
                    },
                    error: {
                      type: 'string',
                      example: 'Resource not found'
                    }
                  }
                }
              }
            }
          },
          ValidationError: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: false
                    },
                    error: {
                      type: 'string',
                      example: 'Validation failed'
                    },
                    errors: {
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    apis: [
      './backend/routes/*.ts',
      './backend/routes/*.js',
      './backend/controllers/*.ts',
      './backend/controllers/*.js',
      './backend/models/*.ts',
      './backend/models/*.js'
    ]
  };