const mongoose = require('mongoose');
const { isMongoActive, localDb } = require('../config/db');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : '';
});

const MongooseUser = mongoose.model('User', userSchema);

/**
 * Universal User model supporting both MongoDB and local persistent storage
 */
const User = {
  // Pass-through schema definition
  schema: userSchema,

  findOne(query) {
    if (isMongoActive()) {
      return MongooseUser.findOne(query);
    }
    const email = query.email ? query.email.toLowerCase() : null;
    const row = email
      ? localDb.prepare('SELECT id, name, email, password, created_at, updated_at FROM users WHERE email = ?').get(email)
      : null;
    const userObj = row ? { ...row, _id: row.id, id: String(row.id) } : null;

    return {
      select() {
        return Promise.resolve(userObj);
      },
      then(resolve, reject) {
        return Promise.resolve(userObj).then(resolve, reject);
      }
    };
  },

  findById(id) {
    if (isMongoActive()) {
      return MongooseUser.findById(id);
    }
    const row = localDb.prepare('SELECT id, name, email, password, created_at, updated_at FROM users WHERE id = ?').get(id);
    const userObj = row ? { ...row, _id: row.id, id: String(row.id) } : null;

    return {
      select() {
        return Promise.resolve(userObj);
      },
      then(resolve, reject) {
        return Promise.resolve(userObj).then(resolve, reject);
      }
    };
  },

  async create(data) {
    if (isMongoActive()) {
      return MongooseUser.create(data);
    }
    const stmt = localDb.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(data.name, data.email.toLowerCase(), data.password);
    const id = Number(result.lastInsertRowid);
    return { _id: id, id: String(id), name: data.name, email: data.email };
  }
};

module.exports = User;
