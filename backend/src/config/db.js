const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const logger = require('./logger');

let isConnectedToMongo = false;

// Ensure local data storage directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const localDb = new DatabaseSync(path.join(dataDir, 'notionflow.db'));
localDb.exec('PRAGMA foreign_keys = ON;');

// Initialize local schema
localDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    is_pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

/**
 * Connect to MongoDB using Mongoose, with automatic zero-crash fallback
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notionflow';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    isConnectedToMongo = true;
    logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch {
    isConnectedToMongo = false;
    logger.warn('No local MongoDB daemon running on 127.0.0.1:27017.');
    logger.info('Enabled local persistent database so your application runs smoothly without crashing.');
    logger.info('To connect to MongoDB Atlas, add your MONGODB_URI in backend/.env');
  }
};

module.exports = {
  connectDB,
  isMongoActive: () => isConnectedToMongo && mongoose.connection.readyState === 1,
  localDb
};
