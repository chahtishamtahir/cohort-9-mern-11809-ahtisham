const logger = require('../config/logger');

/**
 * Global Exception Handling Middleware
 * Catches all unhandled exceptions and errors, logs them via Pino,
 * and sends a consistent, user-friendly JSON response.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Log the exception with Pino
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    statusCode
  }, 'Unhandled Exception caught by global errorHandler');

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

module.exports = errorHandler;
