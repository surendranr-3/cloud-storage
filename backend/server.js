/**
 * BACKEND SERVER - Main Express Application
 * 
 * This file initializes the Express server with middleware configuration and route setup.
 * It handles CORS policy, JSON parsing, and connects all API endpoints.
 * Includes Swagger/OpenAPI documentation at /api-docs
 * 
 * Environment: Uses .env for configuration (PORT, JWT_SECRET, DB_URL, AWS credentials)
 * Port: Default 5000 if not specified
 */

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
require('dotenv').config();

const app = express();

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Swagger/OpenAPI documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/api-docs/swagger.json'
  }
}));

// Swagger spec endpoint
app.get('/api-docs/swagger.json', (req, res) => {
  res.json(swaggerSpec);
});

// Route imports and registration
const authRoutes = require('./routes/auth'); // Authentication endpoints (login, register)
const fileRoutes = require('./routes/files'); // File management endpoints (upload, download, delete, share)
const folderRoutes = require('./routes/folders'); // Folder hierarchy endpoints
const versionsRoutes = require('./routes/versions'); // File version history endpoints

app.use('/api/auth', authRoutes); // Mount auth routes at /api/auth
app.use('/api/files', fileRoutes); // Mount file routes at /api/files
app.use('/api/folders', folderRoutes); // Mount folder routes at /api/folders
app.use('/api/versions', versionsRoutes); // Mount version routes at /api/versions

// Test S3 connection on startup
const { ListBucketsCommand } = require('@aws-sdk/client-s3');
const s3 = require('./s3');
s3.send(new ListBucketsCommand({}))
  .then(data => console.log('✅ S3 connected! Buckets:', data.Buckets.map(b => b.Name)))
  .catch(err => console.error('❌ S3 error:', err.message));

// Start server
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});