/**
 * DATABASE CONNECTION POOL
 * AWS RDS PostgreSQL SSL Configuration
 **/

const pg = require("pg");
const { Pool } = pg;

const fs = require("fs");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DB_URL,

  ssl: {
    ca: fs.readFileSync("./rds-ca.pem").toString(),
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("✅ PostgreSQL RDS Connected"))
  .catch(err => console.error("❌ PostgreSQL Connection Error:", err.message));

module.exports = pool;