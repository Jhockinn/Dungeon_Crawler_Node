# 🏰 Dungeon Crawler 

## 🚀 Quick Start 

```bash
# 1. Setup database (one time only)
createdb dungeon_crawler
cd server
# Use minimal schema (RECOMMENDED - only fully implemented features)
psql -d dungeon_crawler -f db/schema_minimal.sql
psql -d dungeon_crawler -f db/email_verification.sql

# OR use original schema (includes many unused features - not recommended)
# psql -d dungeon_crawler -f db/schema.sql
# psql -d dungeon_crawler -f db/seed.sql
# psql -d dungeon_crawler -f db/email_verification.sql

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

## 🔒 Security Features

- **Email Verification**: Users must verify email before login
- **Socket.io Authentication**: All WebSocket events require authentication
- **Character Ownership Verification**: Players can only control their own characters
- **Input Validation**: Comprehensive validation of all user inputs
- **Password Hashing**: bcrypt with 10 salt rounds
- **Session Management**: Secure HTTP-only cookies

## 📚 Documentation

- [EMAIL_SETUP.md](EMAIL_SETUP.md) - Email verification & password reset setup
- [SECURITY_IMPROVEMENTS.md](SECURITY_IMPROVEMENTS.md) - Security features & recommendations
- [ARCHITECTURE.md](ARCHITECTURE.md) - Project structure & architecture guide
- [CLEANUP.md](CLEANUP.md) - Removed features & database cleanup guide
