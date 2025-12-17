const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const characterRoutes = require('./characterRoutes');
const gameRoutes = require('./gameRoutes');

router.use('/auth', authRoutes);
router.use('/characters', characterRoutes);
router.use('/game', gameRoutes);

module.exports = router;
