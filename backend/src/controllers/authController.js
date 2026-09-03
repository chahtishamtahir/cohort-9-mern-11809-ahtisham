const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../config/logger');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Register a new user
 * POST /api/auth/signup
 */
async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = db.get('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const result = db.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), trimmedEmail, hashedPassword]
    );

    const userId = Number(result.lastInsertRowid);

    // Generate JWT token
    const token = jwt.sign({ id: userId, email: trimmedEmail }, JWT_SECRET, { expiresIn: '7d' });

    // Log user activity
    logger.info({ userId, email: trimmedEmail }, 'New user successfully registered');

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: trimmedEmail
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log in an existing user
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = db.get('SELECT * FROM users WHERE email = ?', [trimmedEmail]);
    if (!user) {
      logger.warn({ email: trimmedEmail }, 'Login failed: email not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn({ userId: user.id, email: trimmedEmail }, 'Login failed: incorrect password');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Log successful user login
    logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signup,
  login,
  getMe
};
