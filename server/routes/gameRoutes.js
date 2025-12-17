const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/game/leaderboard - Get top players
router.get('/leaderboard', gameController.getLeaderboard);

// GET /api/game/enemy-types - Get all enemy types
router.get('/enemy-types', gameController.getEnemyTypes);

module.exports = router;
