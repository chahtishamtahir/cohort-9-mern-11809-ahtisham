const db = require('../config/db');
const logger = require('../config/logger');

/**
 * Get all notes for the authenticated user
 * Supports search query (?search=...) and category filter (?category=...)
 * GET /api/notes
 */
async function getNotes(req, res, next) {
  try {
    const userId = req.user.id;
    const { search, category } = req.query;

    let sql = 'SELECT * FROM notes WHERE user_id = ?';
    const params = [userId];

    // Filter by category if provided and not 'All'
    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }

    // Search in title and content
    if (search && search.trim() !== '') {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    // Order: pinned notes first, then latest updated
    sql += ' ORDER BY is_pinned DESC, updated_at DESC';

    const notes = db.all(sql, params);

    logger.info({ userId, count: notes.length, search, category }, 'Fetched user notes');

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single note by ID
 * GET /api/notes/:id
 */
async function getNoteById(req, res, next) {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const note = db.get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized.'
      });
    }

    return res.status(200).json({
      success: true,
      note
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new note
 * POST /api/notes
 */
async function createNote(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, content, category = 'General', isPinned = false } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note title is required.'
      });
    }

    const pinnedValue = isPinned ? 1 : 0;
    const result = db.run(
      'INSERT INTO notes (user_id, title, content, category, is_pinned) VALUES (?, ?, ?, ?, ?)',
      [userId, title.trim(), content || '', category, pinnedValue]
    );

    const newNoteId = Number(result.lastInsertRowid);
    const createdNote = db.get('SELECT * FROM notes WHERE id = ?', [newNoteId]);

    logger.info({ userId, noteId: newNoteId, title }, 'Created note successfully');

    return res.status(201).json({
      success: true,
      message: 'Note created successfully.',
      note: createdNote
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing note
 * PUT /api/notes/:id
 */
async function updateNote(req, res, next) {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const { title, content, category, isPinned } = req.body;

    // Verify note ownership
    const existing = db.get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized.'
      });
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedContent = content !== undefined ? content : existing.content;
    const updatedCategory = category !== undefined ? category : existing.category;
    const updatedPinned = isPinned !== undefined ? (isPinned ? 1 : 0) : existing.is_pinned;

    db.run(
      `UPDATE notes 
       SET title = ?, content = ?, category = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
      [updatedTitle, updatedContent, updatedCategory, updatedPinned, noteId, userId]
    );

    const updatedNote = db.get('SELECT * FROM notes WHERE id = ?', [noteId]);

    logger.info({ userId, noteId, title: updatedTitle }, 'Updated note successfully');

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      note: updatedNote
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a note
 * DELETE /api/notes/:id
 */
async function deleteNote(req, res, next) {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    // Verify note exists and belongs to user
    const existing = db.get('SELECT id, title FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized.'
      });
    }

    db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]);

    logger.info({ userId, noteId, title: existing.title }, 'Deleted note successfully');

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export all notes for the authenticated user as JSON
 * GET /api/notes/export/all
 */
async function exportNotes(req, res, next) {
  try {
    const userId = req.user.id;
    const notes = db.all('SELECT title, content, category, is_pinned, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    logger.info({ userId, count: notes.length }, 'Exported user notes');

    return res.status(200).json({
      success: true,
      exportDate: new Date().toISOString(),
      user: req.user.email,
      totalNotes: notes.length,
      notes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Import notes for the authenticated user
 * POST /api/notes/import/all
 */
async function importNotes(req, res, next) {
  try {
    const userId = req.user.id;
    const { notes } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid array of notes is required for import.'
      });
    }

    let importedCount = 0;
    for (const item of notes) {
      if (item && item.title) {
        db.run(
          'INSERT INTO notes (user_id, title, content, category, is_pinned) VALUES (?, ?, ?, ?, ?)',
          [userId, item.title, item.content || '', item.category || 'General', item.is_pinned ? 1 : 0]
        );
        importedCount++;
      }
    }

    logger.info({ userId, importedCount }, 'Imported notes successfully');

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${importedCount} notes.`,
      importedCount
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  exportNotes,
  importNotes
};
