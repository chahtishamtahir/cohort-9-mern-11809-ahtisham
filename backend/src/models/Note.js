const mongoose = require('mongoose');
const { isMongoActive, localDb } = require('../config/db');

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true
    },
    content: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    is_pinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

noteSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : '';
});

const MongooseNote = mongoose.model('Note', noteSchema);

/**
 * Universal Note model supporting both MongoDB and local persistent storage
 */
const Note = {
  schema: noteSchema,

  find(filter = {}) {
    if (isMongoActive()) {
      return MongooseNote.find(filter);
    }

    let sql = 'SELECT * FROM notes WHERE 1=1';
    const params = [];

    if (filter.user) {
      sql += ' AND user_id = ?';
      params.push(filter.user);
    }
    if (filter.category && filter.category !== 'All') {
      sql += ' AND category = ?';
      params.push(filter.category);
    }
    if (filter.$or) {
      // Regex search
      const term = filter.$or[0]?.title?.source || '';
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${term}%`, `%${term}%`);
    }

    sql += ' ORDER BY is_pinned DESC, updated_at DESC';

    const execute = () => {
      const rows = localDb.prepare(sql).all(...params);
      return rows.map((r) => ({
        ...r,
        _id: r.id,
        id: String(r.id),
        user: r.user_id,
        is_pinned: Boolean(r.is_pinned)
      }));
    };

    const queryObj = {
      sort() {
        return queryObj;
      },
      select() {
        return queryObj;
      },
      then(resolve, reject) {
        try {
          resolve(execute());
        } catch (err) {
          if (reject) reject(err);
          else throw err;
        }
      }
    };

    return queryObj;
  },

  async findOne(query) {
    if (isMongoActive()) {
      return MongooseNote.findOne(query);
    }
    const row = localDb.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(query._id, query.user);
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      id: String(row.id),
      user: row.user_id,
      is_pinned: Boolean(row.is_pinned)
    };
  },

  async create(data) {
    if (isMongoActive()) {
      return MongooseNote.create(data);
    }
    const stmt = localDb.prepare(
      'INSERT INTO notes (user_id, title, content, category, is_pinned) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(data.user, data.title, data.content || '', data.category || 'General', data.is_pinned ? 1 : 0);
    const id = Number(result.lastInsertRowid);
    return {
      _id: id,
      id: String(id),
      user: data.user,
      title: data.title,
      content: data.content,
      category: data.category,
      is_pinned: Boolean(data.is_pinned),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async findOneAndUpdate(query, update, options = {}) {
    if (isMongoActive()) {
      return MongooseNote.findOneAndUpdate(query, update, options);
    }
    const existing = await this.findOne(query);
    if (!existing) return null;

    const setObj = update.$set || update;
    const title = setObj.title !== undefined ? setObj.title : existing.title;
    const content = setObj.content !== undefined ? setObj.content : existing.content;
    const category = setObj.category !== undefined ? setObj.category : existing.category;
    const isPinned = setObj.is_pinned !== undefined ? (setObj.is_pinned ? 1 : 0) : existing.is_pinned;

    localDb.prepare(
      'UPDATE notes SET title = ?, content = ?, category = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    ).run(title, content, category, isPinned ? 1 : 0, query._id, query.user);

    return this.findOne(query);
  },

  async findOneAndDelete(query) {
    if (isMongoActive()) {
      return MongooseNote.findOneAndDelete(query);
    }
    const existing = await this.findOne(query);
    if (!existing) return null;

    localDb.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(query._id, query.user);
    return existing;
  },

  async insertMany(docs) {
    if (isMongoActive()) {
      return MongooseNote.insertMany(docs);
    }
    const inserted = [];
    for (const doc of docs) {
      const res = await this.create(doc);
      inserted.push(res);
    }
    return inserted;
  }
};

module.exports = Note;
