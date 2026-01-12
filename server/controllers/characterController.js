const pool = require('../config/database');

exports.getAll = async (req, res) => {
    try {
        const userId = req.user.userId;

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

exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Character not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get character error:', error);
        res.status(500).json({ error: 'Failed to get character' });
    }
};

exports.create = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, class: characterClass } = req.body;

        if (!name || !characterClass) {
            return res.status(400).json({ error: 'Name and class are required' });
        }

        if (!['warrior', 'mage', 'rogue'].includes(characterClass)) {
            return res.status(400).json({ error: 'Invalid class. Choose: warrior, mage, or rogue' });
        }

        let stats = { health: 100, attack: 10, defense: 5 };

        if (characterClass === 'warrior') {
            stats = { health: 150, attack: 15, defense: 10 };
        } else if (characterClass === 'mage') {
            stats = { health: 80, attack: 20, defense: 3 };
        } else if (characterClass === 'rogue') {
            stats = { health: 100, attack: 18, defense: 5 };
        }

        const result = await pool.query(`
            INSERT INTO characters
            (user_id, name, class, health, max_health, base_attack, base_defense)
            VALUES ($1, $2, $3, $4, $4, $5, $6)
            RETURNING *
        `, [userId, name, characterClass, stats.health, stats.attack, stats.defense]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create character error:', error);
        res.status(500).json({ error: 'Failed to create character' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

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
