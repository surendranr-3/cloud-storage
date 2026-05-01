/**
 * AUTHENTICATION ROUTES
 * 
 * Handles user registration and login endpoints.
 * Passwords are hashed with bcrypt before storage.
 * Login generates a JWT token valid for 7 days.
 * 
 * Endpoints:
 * - POST /api/auth/register : Create new user account
 * - POST /api/auth/login : Authenticate user and return JWT token
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

/**
 * POST /register
 * Creates a new user account with hashed password
 * 
 * Request body:
 * - name (string): User's full name
 * - email (string): User's email address (should be unique)
 * - password (string): User's password (min 6 chars recommended)
 * 
 * Response: 201 with { id, email } on success
 * Error codes: 400 (missing fields), 500 (server error)
 */
router.post('/register', async (req, res) => {
  try {
    console.log('Body received:', req.body);

    const { name, email, password } = req.body;

    // Validate all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are all required' });
    }

    // Hash password with bcrypt (10 salt rounds)
    const hash = await bcrypt.hash(password, 10);
    
    // Insert user into database with hashed password
    const { rows } = await db.query(
      'INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,email',
      [name, email, hash]
    );
    
    // Return created user (201 status)
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /login
 * Authenticates user and returns a JWT token for future requests
 * 
 * Request body:
 * - email (string): User's email address
 * - password (string): User's password
 * 
 * Response: { token } on success (JWT valid for 7 days)
 * Error codes: 400 (missing fields), 401 (invalid credentials), 500 (server error)
 */
router.post('/login', async (req, res) => {
  try {
    console.log('Body received:', req.body);

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Query user by email
    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows[0]) return res.status(401).json({ error: 'Invalid credentials' });

    // Compare provided password with stored hash
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate JWT token with user ID, expires in 7 days
    const token = jwt.sign(
      { userId: rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return token to client
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;