const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Connect to MongoDB using Mongoose
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notes_app';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    logger.error({ err: error.message }, 'MongoDB connection error');
    logger.warn('Please make sure MongoDB is running locally or provide MONGODB_URI in backend/.env');
  }
};

module.exports = connectDB;
