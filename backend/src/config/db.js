const mongoose = require('mongoose');
const logger = require('./logger');

let isConnectedToMongo = false;

/**
 * Connect to MongoDB database using Mongoose
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notionflow';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    isConnectedToMongo = true;
    logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    isConnectedToMongo = false;
    logger.error({ err: error.message }, 'Failed to connect to MongoDB. Ensure your MongoDB server is running or set MONGODB_URI in backend/.env');
  }
};

mongoose.connection.on('disconnected', () => {
  isConnectedToMongo = false;
  logger.warn('MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  isConnectedToMongo = true;
  logger.info('MongoDB reconnected');
});

module.exports = {
  connectDB,
  isMongoActive: () => isConnectedToMongo && mongoose.connection.readyState === 1
};
