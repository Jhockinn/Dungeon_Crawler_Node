import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
let socket = null;

export function connectSocket() {
    if (socket) return socket;
    
    socket = io(SOCKET_URL, {
        withCredentials: true
    });
    
    socket.on('connect', () => {
    // console.log('Connected to game server:', socket.id);
    });
    
    socket.on('disconnect', () => {
    // console.log('Disconnected from game server');
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
    
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function getSocket() {
    return socket;
}

// Game events
export function startDungeon(characterId, difficulty) {
    if (!socket) throw new Error('Socket not connected');
    socket.emit('startDungeon', { characterId, difficulty });
}

export function movePlayer(sessionId, characterId, direction) {
    if (!socket) throw new Error('Socket not connected');
    socket.emit('move', { sessionId, characterId, direction });
}

export function attackEnemy(sessionId, characterId, enemyId) {
    if (!socket) throw new Error('Socket not connected');
    socket.emit('attack', { sessionId, characterId, enemyId });
}

export function leaveDungeon(sessionId, characterId) {
    if (!socket) throw new Error('Socket not connected');
    socket.emit('leaveDungeon', { sessionId, characterId });
}

// Socket listeners
export function onDungeonReady(callback) {
    if (!socket) return;
    socket.on('dungeonReady', callback);
}

export function onPlayerMoved(callback) {
    if (!socket) return;
    socket.on('playerMoved', callback);
}

export function onCombatUpdate(callback) {
    if (!socket) return;
    socket.on('combatUpdate', callback);
}

export function onEnemyDefeated(callback) {
    if (!socket) return;
    socket.on('enemyDefeated', callback);
}

export function onEnemyEncounter(callback) {
    if (!socket) return;
    socket.on('enemyEncounter', callback);
}

export function onPlayerDamaged(callback) {
  if (!socket) return;
  socket.on('playerDamaged', callback);
}

export function onPlayerDied(callback) {
  if (!socket) return;
  socket.on('playerDied', callback);
}

export function onDungeonCompleted(callback) {
  if (!socket) return;
  socket.on('dungeonCompleted', callback);
}

export function onLevelUp(callback) {
  if (!socket) return;
  socket.on('levelUp', callback);
}