const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { verifyToken } = require('../middleware/auth');

// All note endpoints are protected and require valid authentication
router.use(verifyToken);

// Export & Import
router.get('/export/all', noteController.exportNotes);
router.post('/import/all', noteController.importNotes);

// CRUD routes
router.get('/', noteController.getNotes);
router.post('/', noteController.createNote);
router.get('/:id', noteController.getNoteById);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
