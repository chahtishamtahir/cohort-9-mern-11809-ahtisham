const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const logger = require('./logger');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, 'notes_app.db');
const db = new DatabaseSync(dbPath);

// Enable foreign key constraints
db.exec('PRAGMA foreign_keys = ON;');

// Initialize database schema (Users and Notes tables)
function initDatabase() {
  try {
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Notes table with foreign key reference to users
    db.exec(`
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

    logger.info('Database tables verified and ready.');
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize database schema');
    throw error;
  }
}

// Run schema initialization
initDatabase();

// Clean, beginner-friendly helper methods for executing SQL queries
const database = {
  // Fetch a single row (e.g. find user by email, get note by id)
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },

  // Fetch multiple rows (e.g. list notes for a user)
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  // Insert, update, or delete records
  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  // Direct raw execution (for tests / migrations)
  exec(sql) {
    return db.exec(sql);
  }
};

module.exports = database;
