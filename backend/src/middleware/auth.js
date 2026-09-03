const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_notes_app_2026';

/**
 * Authentication Middleware:
 * Extracts JWT token from the Authorization header, verifies it,
 * and attaches the authenticated user to req.user.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from database to confirm existence
    const user = db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn({ error: error.message }, 'Failed JWT authentication attempt');
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
}

module.exports = {
  verifyToken,
  JWT_SECRET
};
