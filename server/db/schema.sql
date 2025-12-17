-- ============================================
-- DUNGEON CRAWLER - DATABASE SCHEMA
-- ============================================

-- Drop existing tables (careful in production!)
DROP TABLE IF EXISTS user_deletions CASCADE;
DROP TABLE IF EXISTS user_consents CASCADE;
DROP TABLE IF EXISTS character_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS enemy_kills CASCADE;
DROP TABLE IF EXISTS dungeon_sessions CASCADE;
DROP TABLE IF EXISTS enemy_loot CASCADE;
DROP TABLE IF EXISTS enemy_types CASCADE;
DROP TABLE IF EXISTS character_armor CASCADE;
DROP TABLE IF EXISTS character_weapons CASCADE;
DROP TABLE IF EXISTS character_items CASCADE;
DROP TABLE IF EXISTS armor CASCADE;
DROP TABLE IF EXISTS weapons CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==================
-- 1. USERS
-- ==================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ==================
-- 2. CHARACTERS
-- ==================
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    class VARCHAR(20) NOT NULL CHECK (class IN ('warrior', 'mage', 'rogue')),
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    health INTEGER DEFAULT 100,
    max_health INTEGER DEFAULT 100,
    base_attack INTEGER DEFAULT 10,
    base_defense INTEGER DEFAULT 5,
    gold INTEGER DEFAULT 0,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_characters_user_id ON characters(user_id);

-- ==================
-- 3. ITEMS
-- ==================
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('potion', 'armor', 'key', 'consumable')),
    description TEXT,
    effect_type VARCHAR(30),
    effect_value INTEGER,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_consumable BOOLEAN DEFAULT TRUE,
    base_price INTEGER DEFAULT 10,
    sprite_icon VARCHAR(10)
);

-- ==================
-- 4. WEAPONS
-- ==================
CREATE TABLE weapons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sword', 'axe', 'dagger', 'staff', 'bow')),
    description TEXT,
    attack_bonus INTEGER DEFAULT 0,
    defense_bonus INTEGER DEFAULT 0,
    required_level INTEGER DEFAULT 1,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    base_price INTEGER DEFAULT 50,
    sprite_icon VARCHAR(10)
);

-- ==================
-- 5. ARMOR
-- ==================
CREATE TABLE armor (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('helmet', 'chest', 'legs', 'boots', 'shield')),
    description TEXT,
    defense_bonus INTEGER DEFAULT 0,
    health_bonus INTEGER DEFAULT 0,
    required_level INTEGER DEFAULT 1,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    base_price INTEGER DEFAULT 30,
    sprite_icon VARCHAR(10)
);

-- ==================
-- 6. CHARACTER INVENTORY
-- ==================
CREATE TABLE character_items (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, item_id)
);

CREATE TABLE character_weapons (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    weapon_id INTEGER NOT NULL REFERENCES weapons(id),
    is_equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE character_armor (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    armor_id INTEGER NOT NULL REFERENCES armor(id),
    is_equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================
-- 7. ENEMY TYPES
-- ==================
CREATE TABLE enemy_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    health INTEGER NOT NULL,
    max_health INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER DEFAULT 0,
    experience_reward INTEGER DEFAULT 10,
    gold_reward_min INTEGER DEFAULT 5,
    gold_reward_max INTEGER DEFAULT 15,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'boss')),
    difficulty_level INTEGER DEFAULT 1,
    sprite_icon VARCHAR(10)
);

-- ==================
-- 8. ENEMY LOOT
-- ==================
CREATE TABLE enemy_loot (
    id SERIAL PRIMARY KEY,
    enemy_type_id INTEGER NOT NULL REFERENCES enemy_types(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    weapon_id INTEGER REFERENCES weapons(id),
    drop_chance DECIMAL(3, 2) DEFAULT 0.10 CHECK (drop_chance >= 0 AND drop_chance <= 1),
    quantity_min INTEGER DEFAULT 1,
    quantity_max INTEGER DEFAULT 1
);

-- ==================
-- 9. DUNGEON SESSIONS
-- ==================
CREATE TABLE dungeon_sessions (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
    seed VARCHAR(50),
    width INTEGER DEFAULT 15,
    height INTEGER DEFAULT 15,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    completed BOOLEAN DEFAULT FALSE,
    enemies_killed INTEGER DEFAULT 0,
    loot_collected INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0
);

CREATE INDEX idx_dungeon_sessions_character_id ON dungeon_sessions(character_id);
CREATE INDEX idx_dungeon_sessions_active ON dungeon_sessions(is_active);

-- ==================
-- 10. ENEMY KILLS
-- ==================
CREATE TABLE enemy_kills (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    enemy_type_id INTEGER NOT NULL REFERENCES enemy_types(id),
    dungeon_session_id INTEGER REFERENCES dungeon_sessions(id),
    killed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_enemy_kills_character_id ON enemy_kills(character_id);

-- ==================
-- 11. LEADERBOARD
-- ==================
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    dungeons_cleared INTEGER DEFAULT 0,
    total_enemies_killed INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    highest_level_reached INTEGER DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id)
);

CREATE INDEX idx_leaderboard_score ON leaderboard(total_score DESC);

-- ==================
-- 12. ACHIEVEMENTS
-- ==================
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    requirement_type VARCHAR(50),
    requirement_value INTEGER,
    points INTEGER DEFAULT 10,
    icon VARCHAR(10)
);

CREATE TABLE character_achievements (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, achievement_id)
);

-- ==================
-- 13. GDPR COMPLIANCE
-- ==================
CREATE TABLE user_consents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,
    consented BOOLEAN DEFAULT FALSE,
    consented_at TIMESTAMP,
    UNIQUE(user_id, consent_type)
);

CREATE TABLE user_deletions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    username VARCHAR(50),
    email VARCHAR(100),
    deletion_reason TEXT,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(50)
);
