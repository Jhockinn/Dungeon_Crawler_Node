const { generateMaze } = require('../utils/mazeGenerator');
const pool = require('../config/database');

const activeDungeons = new Map();

// ===============================
// XP SYSTEM - Progressive Leveling  
// ===============================
function calculateXPForLevel(level) {
    // XP required = 100 * (level^1.5)
    return Math.floor(100 * Math.pow(level, 1.5));
}

function calculateEnemyXP(enemyName, difficulty) {
    const baseXP = {
        'Goblin': 15,
        'Skeleton': 25,
        'Orc': 40
    };
    return Math.floor((baseXP[enemyName] || 10) * (1 + difficulty * 0.2));
}

async function checkLevelUp(characterId) {
    const result = await pool.query(
        'SELECT level, experience FROM characters WHERE id = $1',
        [characterId]
    );
    
    const { level, experience } = result.rows[0];
    const requiredXP = calculateXPForLevel(level);
    
    if (experience >= requiredXP) {
        const newLevel = level + 1;
        const remainingXP = experience - requiredXP;
        
        // Stats increase per level
        const healthIncrease = 10;
        const attackIncrease = 2;
        const defenseIncrease = 1;
        
        await pool.query(`
            UPDATE characters 
            SET 
                level = $1,
                experience = $2,
                max_health = max_health + $3,
                health = max_health + $3,
                base_attack = base_attack + $4,
                base_defense = base_defense + $5
            WHERE id = $6
        `, [newLevel, remainingXP, healthIncrease, attackIncrease, defenseIncrease, characterId]);
        
        return {
            leveledUp: true,
            newLevel,
            remainingXP,
            stats: {
                healthIncrease,
                attackIncrease,
                defenseIncrease
            }
        };
    }
    
    return { leveledUp: false };
}

function spawnEnemies(maze, difficulty) {
    const enemies = [];
    const enemyCount = 3 + (difficulty * 2);
    
    const walkablePositions = [];
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0 && !(x === 1 && y === 1)) {
                walkablePositions.push({ x, y });
            }
        }
    }
    
    const enemyTypes = [
        { name: 'Goblin', health: 30, attack: 5, sprite: '👹' },
        { name: 'Skeleton', health: 40, attack: 8, sprite: '💀' },
        { name: 'Orc', health: 60, attack: 12, sprite: '🧟' }
    ];
    
    for (let i = 0; i < Math.min(enemyCount, walkablePositions.length); i++) {
        const randomIndex = Math.floor(Math.random() * walkablePositions.length);
        const pos = walkablePositions.splice(randomIndex, 1)[0];
        const typeIndex = Math.min(Math.floor(difficulty / 2), enemyTypes.length - 1);
        const enemyType = enemyTypes[typeIndex];
        
        enemies.push({
            id: `enemy_${i}`,
            ...enemyType,
            maxHealth: enemyType.health,
            position: pos,
            isAlive: true
        });
    }
    
    return enemies;
}

module.exports = (io, socket) => {
    
    socket.on('startDungeon', async ({ characterId, difficulty }) => {
        try {
            // console.log(`Character ${characterId} starting dungeon (difficulty ${difficulty})`);
            
            const charResult = await pool.query(
                'SELECT * FROM characters WHERE id = $1',
                [characterId]
            );
            
            if (charResult.rows.length === 0) {
                return socket.emit('error', { message: 'Character not found' });
            }
            
            const character = charResult.rows[0];
            const mazeSize = 15 + (difficulty * 2);
            const maze = generateMaze(mazeSize, mazeSize);
            
            const sessionResult = await pool.query(`
                INSERT INTO dungeon_sessions 
                (character_id, difficulty, seed, width, height)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, [characterId, difficulty, maze.seed, mazeSize, mazeSize]);
            
            const sessionId = sessionResult.rows[0].id;
            const enemies = spawnEnemies(maze.layout, difficulty);
            const exitX = mazeSize - 2;
            const exitY = mazeSize - 2;
            const exitPoint = { x: exitX, y: exitY };
            
            activeDungeons.set(sessionId, {
                maze: maze.layout,
                enemies: enemies,
                players: new Map(),
                difficulty: difficulty
            });
            
            activeDungeons.get(sessionId).players.set(characterId, {
                position: { x: 1, y: 1 },
                health: character.health,
                socketId: socket.id
            });
            
            socket.join(`dungeon_${sessionId}`);
            
            socket.emit('dungeonReady', {
                sessionId,
                maze: maze.layout,
                enemies: enemies,
                spawnPoint: { x: 1, y: 1 },
                exitPoint: exitPoint,
                character: {
                    id: character.id,
                    name: character.name,
                    class: character.class,
                    level: character.level,
                    experience: character.experience,
                    requiredXP: calculateXPForLevel(character.level),
                    health: character.health,
                    maxHealth: character.max_health,
                    attack: character.base_attack,
                    defense: character.base_defense
                }
            });
            
            // console.log(`Dungeon ${sessionId} created for character ${characterId}`);
        } catch (error) {
            console.error('Start dungeon error:', error);
            socket.emit('error', { message: 'Failed to start dungeon' });
        }
    });
    
    socket.on('move', async ({ sessionId, characterId, direction }) => {
        // console.log(`🎮 MOVE EVENT RECEIVED: session=${sessionId}, char=${characterId}, dir=${direction}`);
        try {
            const dungeon = activeDungeons.get(sessionId);
            // console.log('🏰 Dungeon found:', !!dungeon);
            
            if (!dungeon) {
            // console.log('❌ Dungeon not found in memory!');
                return;
            }
            
            const player = dungeon.players.get(characterId);
            // console.log('👤 Player found:', !!player);
            
            if (!player) {
                // console.log('❌ Player not found in dungeon!');
                return;
            }
            
            const { x, y } = player.position;
            let newX = x;
            let newY = y;
            
            // console.log(`Current position: (${x}, ${y})`);

            switch (direction) {
                case 'up':    newY = y - 1; break;
                case 'down':  newY = y + 1; break;
                case 'left':  newX = x - 1; break;
                case 'right': newX = x + 1; break;
            }
            
            // console.log(`Attempting move to: (${newX}, ${newY})`);
            
            if (dungeon.maze[newY] && dungeon.maze[newY][newX] === 0) {
                // console.log('✅ Move valid! Updating position.');
                player.position = { x: newX, y: newY };
                
                io.to(`dungeon_${sessionId}`).emit('playerMoved', {
                    characterId,
                    position: { x: newX, y: newY }
                });

                // console.log(`🔍 Checking for enemies at (${newX}, ${newY})`);
                // console.log(`📋 Active enemies:`, dungeon.enemies.map(e => ({
                // id: e.id, 
                // name: e.name, 
                // pos: e.position, 
                // alive: e.isAlive
                // })));

                const enemy = dungeon.enemies.find(e => 
                    e.isAlive && e.position.x === newX && e.position.y === newY
                );

                // console.log(`👹 Enemy found:`, !!enemy);

                if (enemy) {
                    // console.log(`⚔️ SENDING enemyEncounter event for ${enemy.name}`);
                    socket.emit('enemyEncounter', { enemy });
                }
                
                const exitX = dungeon.maze.length - 2;
                const exitY = dungeon.maze[0].length - 2;

                if (newX === exitX && newY === exitY) {
                    // console.log(`🚪 Player reached exit!`);
                    
                    // Heal player to full HP
                    await pool.query(`
                        UPDATE characters 
                        SET health = max_health
                        WHERE id = $1
                    `, [characterId]);
                    
                    // Get updated character
                    const charResult = await pool.query(
                        'SELECT health, max_health FROM characters WHERE id = $1',
                        [characterId]
                    );
                    
                    // Mark session as completed
                    await pool.query(`
                        UPDATE dungeon_sessions 
                        SET ended_at = NOW(), is_active = FALSE
                        WHERE id = $1
                    `, [sessionId]);
                    
                    socket.emit('dungeonCompleted', {
                        sessionId,
                        message: 'Victory! You escaped the dungeon!',
                        healed: true,
                        health: charResult.rows[0].health,
                        maxHealth: charResult.rows[0].max_health
                    });
                }
            } else {
                // console.log('❌ Move blocked! Hit a wall.');
            }
        } catch (error) {
            console.error('Move error:', error);
        }
    });
    
    socket.on('attack', async ({ sessionId, characterId, enemyId }) => {
        try {
            const dungeon = activeDungeons.get(sessionId);
            if (!dungeon) return;

            const enemy = dungeon.enemies.find(e => e.id === enemyId);
            if (!enemy || !enemy.isAlive) return;

            const charResult = await pool.query(
                'SELECT base_attack FROM characters WHERE id = $1',
                [characterId]
            );
            
            if (charResult.rows.length === 0) return;
            
            const character = charResult.rows[0];
            const damage = Math.floor(character.base_attack * (0.8 + Math.random() * 0.4));
            enemy.health -= damage;

            if (enemy.health <= 0) {
                enemy.health = 0;
                enemy.isAlive = false;

                // Award XP
                const xpGained = calculateEnemyXP(enemy.name, dungeon.difficulty);
                
                await pool.query(`
                    UPDATE characters 
                    SET experience = experience + $1
                    WHERE id = $2
                `, [xpGained, characterId]);

                // Check for level up
                const levelUpResult = await checkLevelUp(characterId);

                await pool.query(`
                    UPDATE dungeon_sessions 
                    SET enemies_killed = enemies_killed + 1
                    WHERE id = $1
                `, [sessionId]);

                // Get updated character stats
                const charStats = await pool.query(`
                    SELECT level, experience, max_health, base_attack, base_defense 
                    FROM characters WHERE id = $1
                `, [characterId]);
                
                const char = charStats.rows[0];
                const requiredXP = calculateXPForLevel(char.level);

                io.to(`dungeon_${sessionId}`).emit('enemyDefeated', {
                    enemyId,
                    killedBy: characterId,
                    xpGained,
                    currentXP: char.experience,
                    requiredXP,
                    level: char.level
                });

                if (levelUpResult.leveledUp) {
                    socket.emit('levelUp', {
                        newLevel: levelUpResult.newLevel,
                        stats: levelUpResult.stats,
                        currentXP: levelUpResult.remainingXP,
                        requiredXP: calculateXPForLevel(levelUpResult.newLevel),
                        maxHealth: char.max_health,
                        attack: char.base_attack,
                        defense: char.base_defense
                    });
                }
            } else {
                io.to(`dungeon_${sessionId}`).emit('combatUpdate', {
                    enemyId,
                    damage,
                    health: enemy.health
                });
                
                const player = dungeon.players.get(characterId);
                if (player) {
                    const enemyDamage = Math.floor(enemy.attack * (0.8 + Math.random() * 0.4));
                    player.health -= enemyDamage;
                        
                    await pool.query(
                        'UPDATE characters SET health = GREATEST(health - $1, 0) WHERE id = $2',
                        [enemyDamage, characterId]
                    );
                        
                    const charResult = await pool.query(
                        'SELECT health, max_health FROM characters WHERE id = $1',
                        [characterId]
                    );
                        
                    const updatedHealth = charResult.rows[0].health;
                        
                    io.to(`dungeon_${sessionId}`).emit('playerDamaged', {
                        characterId,
                        damage: enemyDamage,
                        health: updatedHealth,
                        maxHealth: charResult.rows[0].max_health,
                        enemyName: enemy.name
                    });
                        
                    if (updatedHealth <= 0) {
                        // console.log(`💀 Player ${characterId} died!`);
                        
                        // Heal player to full HP
                        await pool.query(`
                            UPDATE characters 
                            SET health = max_health
                            WHERE id = $1
                        `, [characterId]);
                        
                        // Get updated character
                        const healedChar = await pool.query(
                            'SELECT health, max_health FROM characters WHERE id = $1',
                            [characterId]
                        );
                        
                        // Mark session as ended (failed)
                        await pool.query(`
                            UPDATE dungeon_sessions 
                            SET ended_at = NOW(), is_active = FALSE
                            WHERE id = $1
                        `, [sessionId]);
                        
                        // Clean up dungeon
                        dungeon.players.delete(characterId);
                        if (dungeon.players.size === 0) {
                            activeDungeons.delete(sessionId);
                        }
                        
                        socket.emit('playerDied', {
                            characterId,
                            message: 'You have been defeated!',
                            healed: true,
                            health: healedChar.rows[0].health,
                            maxHealth: healedChar.rows[0].max_health
                        });
                    }
                }                
            }
        } catch (error) {
            console.error('Attack error:', error);
        }
    });
    
    socket.on('leaveDungeon', async ({ sessionId, characterId }) => {
        try {
            const dungeon = activeDungeons.get(sessionId);
            if (dungeon) {
                dungeon.players.delete(characterId);
                if (dungeon.players.size === 0) {
                    activeDungeons.delete(sessionId);
                }
            }
            
            await pool.query(`
                UPDATE characters 
                SET health = max_health
                WHERE id = $1
            `, [characterId]);
            
            await pool.query(`
                UPDATE dungeon_sessions 
                SET ended_at = NOW(), is_active = FALSE
                WHERE id = $1
            `, [sessionId]);
            
            socket.leave(`dungeon_${sessionId}`);
        } catch (error) {
            console.error('Leave dungeon error:', error);
        }
    });
};