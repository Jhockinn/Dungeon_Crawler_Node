const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const { requireAuth } = require('../middleware/auth');

// GET /api/characters - Get all characters for logged-in user
router.get('/', requireAuth, characterController.getAll);

// GET /api/characters/:id - Get single character details
router.get('/:id', requireAuth, characterController.getOne);

// POST /api/characters - Create new character
router.post('/', requireAuth, characterController.create);

// DELETE /api/characters/:id - Delete character
router.delete('/:id', requireAuth, characterController.delete);

module.exports = router;
