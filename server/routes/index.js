const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const characterRoutes = require('./characterRoutes');

router.use('/auth', authRoutes);
router.use('/characters', characterRoutes);

module.exports = router;
