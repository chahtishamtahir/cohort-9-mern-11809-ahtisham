const dns = require('node:dns');
const mongoose = require('mongoose');
const logger = require('./logger');

// Configure public DNS resolvers to prevent querySrv EBADRESP on Windows/ISP networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if custom DNS cannot be set
}

/**
 * Connect to MongoDB database using Mongoose
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notionflow';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    logger.error({ err: error.message }, 'Failed to connect to MongoDB. Ensure your MongoDB server is running or set MONGODB_URI in backend/.env');
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = {
  connectDB
};
