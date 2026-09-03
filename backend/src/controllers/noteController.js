const Note = require('../models/Note');
const logger = require('../config/logger');

/**
 * Get all notes for authenticated user
 * Supports search query (?search=...) and category filter (?category=...)
 * GET /api/notes
 */
async function getNotes(req, res, next) {
  try {
    const userId = req.user._id;
    const { search, category } = req.query;

    const filter = { user: userId };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { content: searchRegex }];
    }

    const notes = await Note.find(filter).sort({ is_pinned: -1, updated_at: -1 });

    logger.info({ userId, count: notes.length, search, category }, 'Fetched user notes from MongoDB');

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
    const userId = req.user._id;
    const noteId = req.params.id;

    const note = await Note.findOne({ _id: noteId, user: userId });

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
    const userId = req.user._id;
    const { title, content, category = 'General', isPinned = false } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note title is required.'
      });
    }

    const note = await Note.create({
      user: userId,
      title: title.trim(),
      content: content || '',
      category: category || 'General',
      is_pinned: Boolean(isPinned)
    });

    logger.info({ userId, noteId: note._id, title }, 'Created note successfully in MongoDB');

    return res.status(201).json({
      success: true,
      message: 'Note created successfully.',
      note
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
    const userId = req.user._id;
    const noteId = req.params.id;
    const { title, content, category, isPinned } = req.body;

    const updateFields = {};
    if (title !== undefined) updateFields.title = title.trim();
    if (content !== undefined) updateFields.content = content;
    if (category !== undefined) updateFields.category = category;
    if (isPinned !== undefined) updateFields.is_pinned = Boolean(isPinned);

    const updatedNote = await Note.findOneAndUpdate(
      { _id: noteId, user: userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized.'
      });
    }

    logger.info({ userId, noteId, title: updatedNote.title }, 'Updated note successfully in MongoDB');

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
    const userId = req.user._id;
    const noteId = req.params.id;

    const deleted = await Note.findOneAndDelete({ _id: noteId, user: userId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized.'
      });
    }

    logger.info({ userId, noteId, title: deleted.title }, 'Deleted note successfully from MongoDB');

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export all notes for authenticated user as JSON
 * GET /api/notes/export/all
 */
async function exportNotes(req, res, next) {
  try {
    const userId = req.user._id;
    const notes = await Note.find({ user: userId }).select('title content category is_pinned created_at updated_at');

    logger.info({ userId, count: notes.length }, 'Exported user notes from MongoDB');

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
 * Import notes for authenticated user
 * POST /api/notes/import/all
 */
async function importNotes(req, res, next) {
  try {
    const userId = req.user._id;
    const { notes } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid array of notes is required for import.'
      });
    }

    const docsToInsert = notes
      .filter((item) => item && item.title)
      .map((item) => ({
        user: userId,
        title: item.title,
        content: item.content || '',
        category: item.category || 'General',
        is_pinned: Boolean(item.is_pinned || item.isPinned)
      }));

    const inserted = await Note.insertMany(docsToInsert);

    logger.info({ userId, importedCount: inserted.length }, 'Imported notes successfully into MongoDB');

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} notes.`,
      importedCount: inserted.length
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
