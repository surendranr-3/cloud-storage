/**
 * DATABASE CONNECTION POOL
 * 
 * Initializes a PostgreSQL connection pool using the pg library.
 * This module exports a reusable pool instance for all database queries.
 * 
 * Configuration:
 * - Connection string from environment variable: DB_URL
 * - Pool automatically manages connection lifecycle
 * - Used by auth and file routes for executing database queries
 */

const { Pool } = require('pg');

// Create and export PostgreSQL connection pool
const pool = new Pool({ connectionString: process.env.DB_URL });

module.exports = pool;