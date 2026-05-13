/**
 * SWAGGER/OPENAPI CONFIGURATION
 * 
 * Defines the API documentation for CloudVault using OpenAPI 3.0 specification.
 * This is used by swagger-ui-express to generate interactive API documentation.
 * 
 * Access documentation at: http://localhost:5000/api-docs
 */

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'CloudVault API',
    description: 'Professional Cloud Storage API with JWT authentication, S3 integration, and advanced file management',
    version: '1.0.0',
    contact: {
      name: 'CloudVault Support',
      email: 'support@cloudvault.com',
      url: 'https://github.com/surendranr-3/cloud-storage'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development Server'
    },
    {
      url: 'http://65.0.89.9:5000/api',
      description: 'Production Server'
    }
  ],
  tags: [
    { name: 'Authentication', description: 'User login and registration' },
    { name: 'Files', description: 'File upload, download, delete, share' },
    { name: 'Folders', description: 'Folder hierarchy and management' },
    { name: 'Versions', description: 'File version history and restore' },
    { name: 'Search', description: 'Search and filter functionality' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/auth/login endpoint'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Error message' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      File: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          owner_id: { type: 'integer' },
          name: { type: 'string' },
          size_bytes: { type: 'integer' },
          mime_type: { type: 'string' },
          s3_key: { type: 'string' },
          folder_id: { type: 'integer', nullable: true },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Folder: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          owner_id: { type: 'integer' },
          name: { type: 'string' },
          parent_id: { type: 'integer', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      FileVersion: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          file_id: { type: 'integer' },
          version_number: { type: 'integer' },
          size_bytes: { type: 'integer' },
          mime_type: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user account',
        description: 'Creates a new user account with email and password (hashed with bcrypt)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', format: 'password', example: 'securepass123', minLength: 6 }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User successfully registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '400': {
            description: 'Missing required fields',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login and get JWT token',
        description: 'Authenticates user and returns JWT token (valid for 7 days)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', description: 'JWT token for authenticated requests' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/files/upload': {
      post: {
        tags: ['Files'],
        summary: 'Upload file to S3',
        description: 'Uploads a file to AWS S3 and creates database record. Max 500 MB.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  folder_id: { type: 'integer', description: 'Optional folder ID' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'File uploaded successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/File' }
              }
            }
          },
          '401': {
            description: 'Unauthorized - missing or invalid token'
          }
        }
      }
    },
    '/files': {
      get: {
        tags: ['Files'],
        summary: 'List all files',
        description: 'Returns all files uploaded by authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of files',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/File' } }
              }
            }
          }
        }
      }
    },
    '/files/search': {
      get: {
        tags: ['Search'],
        summary: 'Search files',
        description: 'Search for files by name, type, date range, and size',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['image', 'pdf', 'video', 'audio', 'document'] } },
          { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'size_from', in: 'query', schema: { type: 'integer' } },
          { name: 'size_to', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    results: { type: 'array', items: { $ref: '#/components/schemas/File' } },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                    hasMore: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/folders': {
      get: {
        tags: ['Folders'],
        summary: 'List folders',
        description: 'Lists all folders owned by authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'parent_id', in: 'query', schema: { type: 'integer' }, description: 'Filter by parent folder' }
        ],
        responses: {
          '200': {
            description: 'List of folders',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Folder' } }
              }
            }
          }
        }
      },
      post: {
        tags: ['Folders'],
        summary: 'Create folder',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  parent_id: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Folder created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Folder' }
              }
            }
          }
        }
      }
    },
    '/versions/{fileId}/versions': {
      get: {
        tags: ['Versions'],
        summary: 'List file versions',
        description: 'Lists all versions of a specific file',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'fileId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': {
            description: 'List of versions',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/FileVersion' } }
              }
            }
          }
        }
      }
    },
    '/versions/{fileId}/restore/{versionId}': {
      post: {
        tags: ['Versions'],
        summary: 'Restore file to previous version',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'fileId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'versionId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': {
            description: 'File restored successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    file: { $ref: '#/components/schemas/File' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
