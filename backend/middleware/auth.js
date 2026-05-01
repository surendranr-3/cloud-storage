/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * Verifies JWT tokens from the Authorization header.
 * Must be applied to all protected routes that require authentication.
 * 
 * Process:
 * 1. Extracts token from "Authorization: Bearer <token>" header
 * 2. Verifies token signature using JWT_SECRET
 * 3. Attaches decoded user data to req.user if valid
 * 4. Passes control to next middleware if authenticated
 * 5. Returns 401 Unauthorized if token is missing or invalid
 * 
 * Usage: router.get('/protected', auth, handler)
 */

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Extract token from Authorization header (expected format: "Bearer <token>")
  const token = req.headers.authorization?.split(' ')[1];
  
  // Return 401 if no token is provided
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    // Verify token signature and decode payload
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); // Token is valid, proceed to next middleware
  } catch {
    // Return 401 if token is invalid, expired, or tampered with
    res.status(401).json({ error: 'Invalid token' });
  }
};