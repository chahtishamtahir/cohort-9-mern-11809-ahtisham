const logger = require('../config/logger');

/**
 * Global Exception Handling Middleware
 * Catches all unhandled exceptions and errors, logs them via Pino,
 * and sends a consistent, user-friendly JSON response.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'An unexpected internal server error occurred.';

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for parameter '${err.path || 'id'}'.`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    message = errors.length > 0 ? errors.join(', ') : err.message;
  }

  // Handle Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with this ${field} already exists.`;
  }

  // Log the exception with Pino
  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      statusCode
    }, 'Unhandled Exception caught by global errorHandler');
  } else {
    logger.warn({
      message,
      path: req.originalUrl,
      method: req.method,
      statusCode
    }, 'Client error handled by global errorHandler');
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

module.exports = errorHandler;
