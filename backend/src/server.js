require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Application-wide HTTP request & response logging with Pino
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Notes App Backend API'
  });
});

// Mount application routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global exception handling middleware (must be registered after all routes)
app.use(errorHandler);

const { connectDB } = require('./config/db');

// Start server only when executed directly (not when required for tests)
if (require.main === module) {
  connectDB();
  app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
