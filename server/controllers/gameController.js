const pool = require('../config/database');

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.username,
                c.name as character_name,
                c.class,
                c.level,
                l.total_score,
                l.dungeons_cleared,
                l.total_enemies_killed
            FROM leaderboard l
            JOIN characters c ON l.character_id = c.id
            JOIN users u ON c.user_id = u.id
            ORDER BY l.total_score DESC
            LIMIT 100
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
};

// Get enemy types
exports.getEnemyTypes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM enemy_types ORDER BY difficulty_level');
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get enemy types error:', error);
        res.status(500).json({ error: 'Failed to get enemy types' });
    }
};
