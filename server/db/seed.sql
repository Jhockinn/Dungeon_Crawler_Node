-- ============================================
-- SEED DATA FOR DUNGEON CRAWLER
-- ============================================

-- Insert Items
INSERT INTO items (name, type, effect_type, effect_value, rarity, base_price, sprite_icon) VALUES
    ('Health Potion', 'potion', 'heal', 50, 'common', 10, '🧪'),
    ('Greater Health Potion', 'potion', 'heal', 100, 'rare', 25, '⚗️'),
    ('Iron Key', 'key', 'unlock', 1, 'common', 5, '🔑'),
    ('Golden Key', 'key', 'unlock', 1, 'rare', 20, '🗝️');

-- Insert Weapons
INSERT INTO weapons (name, type, attack_bonus, defense_bonus, required_level, rarity, base_price, sprite_icon) VALUES
    ('Rusty Sword', 'sword', 5, 0, 1, 'common', 10, '🗡️'),
    ('Iron Sword', 'sword', 15, 2, 3, 'common', 50, '⚔️'),
    ('Steel Axe', 'axe', 20, 1, 5, 'rare', 100, '🪓'),
    ('Magic Staff', 'staff', 5, 0, 1, 'common', 30, '🪄'),
    ('Dragon Slayer', 'sword', 50, 10, 10, 'legendary', 500, '⚔️'),
    ('Elven Bow', 'bow', 25, 5, 7, 'epic', 200, '🏹');

-- Insert Armor
INSERT INTO armor (name, type, defense_bonus, health_bonus, required_level, rarity, base_price, sprite_icon) VALUES
    ('Leather Helmet', 'helmet', 3, 5, 1, 'common', 20, '⛑️'),
    ('Iron Chest Plate', 'chest', 10, 20, 3, 'common', 60, '🛡️'),
    ('Steel Shield', 'shield', 8, 0, 4, 'rare', 80, '🛡️'),
    ('Dragon Scale Armor', 'chest', 30, 50, 10, 'legendary', 400, '🛡️');

-- Insert Enemy Types
INSERT INTO enemy_types (name, health, max_health, attack, defense, experience_reward, gold_reward_min, gold_reward_max, rarity, difficulty_level, sprite_icon) VALUES
    ('Goblin', 50, 50, 10, 2, 10, 3, 8, 'common', 1, '👹'),
    ('Skeleton', 60, 60, 12, 5, 15, 5, 10, 'common', 2, '💀'),
    ('Orc', 100, 100, 20, 8, 25, 10, 20, 'common', 3, '🧟'),
    ('Dark Mage', 80, 80, 25, 5, 35, 15, 30, 'rare', 4, '🧙'),
    ('Troll', 150, 150, 30, 15, 50, 20, 40, 'rare', 5, '👺'),
    ('Ancient Dragon', 500, 500, 50, 30, 200, 100, 200, 'boss', 10, '🐉');

-- Insert Enemy Loot Drops
INSERT INTO enemy_loot (enemy_type_id, item_id, drop_chance, quantity_min, quantity_max) VALUES
    (1, 1, 0.30, 1, 2), -- Goblins drop health potions
    (3, 2, 0.15, 1, 1), -- Orcs drop greater health potions
    (6, 4, 0.50, 1, 1); -- Dragons drop golden keys

INSERT INTO enemy_loot (enemy_type_id, weapon_id, drop_chance) VALUES
    (3, 3, 0.10), -- Orcs drop steel axe
    (6, 5, 0.25); -- Dragons drop Dragon Slayer

-- Insert Achievements
INSERT INTO achievements (name, description, requirement_type, requirement_value, points, icon) VALUES
    ('First Blood', 'Defeat your first enemy', 'kill_count', 1, 10, '⚔️'),
    ('Goblin Slayer', 'Defeat 50 goblins', 'kill_count', 50, 25, '👹'),
    ('Dungeon Master', 'Clear 10 dungeons', 'dungeon_clear', 10, 50, '🏰'),
    ('Dragon Slayer', 'Defeat a dragon', 'boss_kill', 1, 100, '🐉'),
    ('Legend', 'Reach level 20', 'reach_level', 20, 200, '⭐');
