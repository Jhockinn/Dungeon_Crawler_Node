const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, characterController.getAll);

router.get('/:id', requireAuth, characterController.getOne);

router.post('/', requireAuth, characterController.create);

router.delete('/:id', requireAuth, characterController.delete);

module.exports = router;
