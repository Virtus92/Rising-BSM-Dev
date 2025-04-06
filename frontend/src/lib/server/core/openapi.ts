import { config } from '../config/env';

/**
 * OpenAPI Dokumentation für das Rising BSM API
 */
export const openApiDocument = {
  openapi: '3.0.1',
  info: {
    title: 'Rising BSM API',
    description: 'API für Rising Business Service Management',
    version: '1.0.0',
    contact: {
      name: 'Rising BSM Support',
      email: 'support@rising-bsm.example.com'
    }
  },
  servers: [
    {
      url: `${config.isProduction ? 'https' : 'http'}://${config.env.APP_URL}/api`,
      description: `${config.env.NODE_ENV} Server`
    }
  ],
  tags: [
    { name: 'auth', description: 'Authentifizierung & Autorisierung' },
    { name: 'users', description: 'Benutzerverwaltung' },
    { name: 'customers', description: 'Kundenverwaltung' },
    { name: 'projects', description: 'Projektverwaltung' },
    { name: 'appointments', description: 'Terminverwaltung' },
    { name: 'services', description: 'Dienstverwaltung' },
    { name: 'notifications', description: 'Benachrichtigungen' },
    { name: 'dashboard', description: 'Dashboard & Reporting' },
    { name: 'profile', description: 'Benutzerprofil' },
    { name: 'settings', description: 'Systemeinstellungen' },
    { name: 'files', description: 'Dateiupload & -download' }
  ],
  paths: {
    // Authentifizierung
    '/auth/login': {
      post: {
        tags: ['auth'],
        summary: 'Benutzeranmeldung',
        operationId: 'login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'benutzer@example.com'
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    example: 'sicheres-passwort'
                  },
                  rememberMe: {
                    type: 'boolean',
                    example: false
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Erfolgreiche Anmeldung',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse'
                }
              }
            }
          },
          '401': {
            description: 'Authentifizierung fehlgeschlagen',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['auth'],
        summary: 'Access-Token mit Refresh-Token aktualisieren',
        operationId: 'refreshToken',
        responses: {
          '200': {
            description: 'Token erfolgreich aktualisiert',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse'
                }
              }
            }
          },
          '401': {
            description: 'Ungültiges oder abgelaufenes Refresh-Token',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['auth'],
        summary: 'Passwort-Zurücksetzung anfordern',
        operationId: 'forgotPassword',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'benutzer@example.com'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Zurücksetzung wurde gesendet (immer 200, auch wenn E-Mail nicht existiert)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuccessResponse'
                }
              }
            }
          }
        }
      }
    },
    
    // Benutzerverwaltung
    '/users': {
      get: {
        tags: ['users'],
        summary: 'Alle Benutzer abrufen',
        operationId: 'getUsers',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Seitennummer für Paginierung',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Anzahl der Einträge pro Seite',
            schema: { type: 'integer', default: 10 }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Suchbegriff nach Name oder E-Mail',
            schema: { type: 'string' }
          },
          {
            name: 'role',
            in: 'query',
            description: 'Filtern nach Benutzerrolle',
            schema: { type: 'string' }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filtern nach Benutzerstatus',
            schema: { type: 'string', enum: ['active', 'inactive', 'blocked'] }
          }
        ],
        responses: {
          '200': {
            description: 'Liste der Benutzer',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/PaginationMeta'
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Nicht autorisiert',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '403': {
            description: 'Keine Berechtigung',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['users'],
        summary: 'Neuen Benutzer anlegen',
        operationId: 'createUser',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string', example: 'Max Mustermann' },
                  email: { type: 'string', format: 'email', example: 'max@example.com' },
                  password: { type: 'string', format: 'password', example: 'sicheres-passwort' },
                  role: { type: 'string', enum: ['admin', 'manager', 'employee'], example: 'employee' },
                  phone: { type: 'string', example: '+43 1234 5678' },
                  status: { type: 'string', enum: ['active', 'inactive'], example: 'active' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Benutzer erstellt',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      $ref: '#/components/schemas/User'
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validierungsfehler',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationErrorResponse'
                }
              }
            }
          },
          '401': {
            description: 'Nicht autorisiert',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '403': {
            description: 'Keine Berechtigung',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    
    // Weitere API-Routen können hier hinzugefügt werden
    // ...

    // Datei-Upload
    '/files/upload': {
      post: {
        tags: ['files'],
        summary: 'Datei hochladen',
        operationId: 'uploadFile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'type'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  type: { 
                    type: 'string', 
                    enum: ['profilePictures', 'documents', 'general'],
                    example: 'documents'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Datei erfolgreich hochgeladen',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        filePath: { type: 'string', example: '/uploads/documents/f8d7g93j-1617293748213.pdf' },
                        fileName: { type: 'string', example: 'f8d7g93j-1617293748213.pdf' },
                        mimeType: { type: 'string', example: 'application/pdf' },
                        size: { type: 'integer', example: 125365 }
                      }
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Fehler beim Hochladen der Datei',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '401': {
            description: 'Nicht autorisiert',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      // Erfolgs- und Fehlerantworten
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Ein Fehler ist aufgetreten' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              requestId: { type: 'string', example: '5f8d3a9c-1b9d-4b9c-8580-9c2f4d9d5a1b' }
            }
          }
        }
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Validierungsfehler' },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: ['Email ist ungültig', 'Passwort muss mindestens 8 Zeichen lang sein']
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              requestId: { type: 'string', example: '5f8d3a9c-1b9d-4b9c-8580-9c2f4d9d5a1b' }
            }
          }
        }
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          pagination: {
            type: 'object',
            properties: {
              current: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 5 },
              totalRecords: { type: 'integer', example: 42 }
            }
          },
          filters: {
            type: 'object',
            additionalProperties: true,
            example: { status: 'active', search: 'max' }
          }
        }
      },
      
      // Authentifizierung
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
            }
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      
      // Datenmodelle
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Max Mustermann' },
          email: { type: 'string', format: 'email', example: 'max@example.com' },
          role: { type: 'string', example: 'employee' },
          phone: { type: 'string', example: '+43 1234 5678' },
          status: { type: 'string', example: 'active' },
          profilePicture: { type: 'string', example: '/uploads/profiles/avatar-123.jpg' },
          lastLoginAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Anna Beispiel' },
          company: { type: 'string', example: 'Beispiel GmbH' },
          email: { type: 'string', format: 'email', example: 'anna@beispiel.at' },
          phone: { type: 'string', example: '+43 1234 5678' },
          address: { type: 'string', example: 'Beispielstraße 123' },
          postalCode: { type: 'string', example: '1010' },
          city: { type: 'string', example: 'Wien' },
          country: { type: 'string', example: 'Austria' },
          notes: { type: 'string', example: 'Wichtiger Kunde' },
          newsletter: { type: 'boolean', example: true },
          status: { type: 'string', example: 'active' },
          type: { type: 'string', example: 'business' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Website-Redesign' },
          customerId: { type: 'integer', example: 1 },
          serviceId: { type: 'integer', example: 2 },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          amount: { type: 'number', format: 'float', example: 5000.00 },
          description: { type: 'string', example: 'Komplettes Redesign der Website' },
          status: { type: 'string', example: 'in-progress' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Kundenbesprechung' },
          customerId: { type: 'integer', example: 1 },
          projectId: { type: 'integer', example: 2 },
          appointmentDate: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', example: 60 },
          location: { type: 'string', example: 'Büro Wien' },
          description: { type: 'string', example: 'Besprechung des Projektfortschritts' },
          status: { type: 'string', example: 'planned' },
          createdBy: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Service: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Website-Entwicklung' },
          description: { type: 'string', example: 'Entwicklung von responsiven Websites' },
          basePrice: { type: 'number', format: 'float', example: 800.00 },
          vatRate: { type: 'number', format: 'float', example: 20.00 },
          active: { type: 'boolean', example: true },
          unit: { type: 'string', example: 'Stunde' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

/**
 * Exportiert die Schemata für die Verwendung in anderen Teilen der Anwendung
 */
export const apiSchemas = openApiDocument.components.schemas;
