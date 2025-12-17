const pool = require('../config/database');

// Get all characters belonging to the logged-in user
// Returns array of characters sorted by most recently played
exports.getAll = async (req, res) => {
    try {
        // Get user ID from session (set by requireAuth middleware)
        const userId = req.user.userId;
        
        // Query database for all characters owned by this user
        const result = await pool.query(
            'SELECT * FROM characters WHERE user_id = $1 ORDER BY last_played DESC',
            [userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get characters error:', error);
        res.status(500).json({ error: 'Failed to get characters' });
    }
};

// Get detailed information about a single character
// Includes equipped weapon and total stats calculation
exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        
        // Join with weapons table to get equipped weapon info
        // Calculate total attack/defense (base + weapon bonuses)
        const result = await pool.query(`
            SELECT 
                c.*,
                w.name as weapon_name,
                w.attack_bonus,
                (c.base_attack + COALESCE(w.attack_bonus, 0)) as total_attack,
                (c.base_defense + COALESCE(w.defense_bonus, 0)) as total_defense
            FROM characters c
            LEFT JOIN character_weapons cw ON c.id = cw.character_id AND cw.is_equipped = TRUE
            LEFT JOIN weapons w ON cw.weapon_id = w.id
            WHERE c.id = $1 AND c.user_id = $2
        `, [id, userId]);
        
        // Check if character exists and belongs to this user
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get character error:', error);
        res.status(500).json({ error: 'Failed to get character' });
    }
};

// Create a new character for the logged-in user
// Sets class-specific stats (warrior/mage/rogue have different starting stats)
exports.create = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, class: characterClass } = req.body;
        
        // Validate that name and class are provided
        if (!name || !characterClass) {
            return res.status(400).json({ error: 'Name and class are required' });
        }
        
        // Validate class is one of the three allowed types
        if (!['warrior', 'mage', 'rogue'].includes(characterClass)) {
            return res.status(400).json({ error: 'Invalid class. Choose: warrior, mage, or rogue' });
        }
        
        // Set class-specific starting stats
        // Warrior: High HP and defense (tank)
        // Mage: High attack, low defense (glass cannon)
        // Rogue: Balanced stats
        let stats = { health: 100, attack: 10, defense: 5 };
        
        if (characterClass === 'warrior') {
            stats = { health: 150, attack: 15, defense: 10 };
        } else if (characterClass === 'mage') {
            stats = { health: 80, attack: 20, defense: 3 };
        } else if (characterClass === 'rogue') {
            stats = { health: 100, attack: 18, defense: 5 };
        }
        
        // Insert new character into database
        const result = await pool.query(`
            INSERT INTO characters 
            (user_id, name, class, health, max_health, base_attack, base_defense)
            VALUES ($1, $2, $3, $4, $4, $5, $6)
            RETURNING *
        `, [userId, name, characterClass, stats.health, stats.attack, stats.defense]);
        
        // Create leaderboard entry for this character (starts at 0 score)
        await pool.query(`
            INSERT INTO leaderboard (character_id)
            VALUES ($1)
        `, [result.rows[0].id]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create character error:', error);
        res.status(500).json({ error: 'Failed to create character' });
    }
};

// Delete a character
// Only allows deleting if character belongs to logged-in user
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        
        // Delete character (CASCADE will also delete related data)
        await pool.query(
            'DELETE FROM characters WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        
        res.json({ message: 'Character deleted successfully' });
    } catch (error) {
        console.error('Delete character error:', error);
        res.status(500).json({ error: 'Failed to delete character' });
    }
};
