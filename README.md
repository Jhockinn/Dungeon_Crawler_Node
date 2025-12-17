# 🏰 Dungeon Crawler - Quick Reference

## 🚀 Quick Start (3 Commands)

```bash
# 1. Setup database (one time only)
createdb dungeon_crawler
cd server
psql -d dungeon_crawler -f db/schema.sql
psql -d dungeon_crawler -f db/seed.sql

# 2. Start server (keep running)
cd server
npm install
npm run dev
# Server runs on: http://localhost:8080

# 3. Start client (new terminal, keep running)
cd client  
npm install
npm run dev
# Client runs on: http://localhost:5173
```

Then open: **http://localhost:5173**

## 🎮 Game Flow

```
Register → Login → Create Character → Select Difficulty → Play!
```

## 🎯 Controls

```
WASD or Arrow Keys = Move
Click Enemy        = Select target
SPACE             = Attack selected enemy
```

## ⚔️ Character Classes

| Class   | Icon | HP  | ATK | DEF |
|---------|------|-----|-----|-----|
| Warrior | ⚔️   | 150 | 15  | 10  |
| Mage    | 🔮   | 80  | 20  | 3   |
| Rogue   | 🗡️   | 100 | 18  | 5   |
