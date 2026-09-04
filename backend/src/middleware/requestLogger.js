const pinoHttp = require('pino-http');
const logger = require('../config/logger');

// HTTP request and response logging middleware
const requestLogger = pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: function (req, res) {
    return `${req.method} ${req.url} completed with status ${res.statusCode}`;
  },
  customErrorMessage: function (req, res, err) {
    return `${req.method} ${req.url} failed with status ${res.statusCode}: ${err.message}`;
  }
});

module.exports = requestLogger;
