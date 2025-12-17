import { writable } from 'svelte/store';

function createGameStore() {
    const { subscribe, set, update } = writable({
        sessionId: null,
        maze: null,
        character: null,
        enemies: [],
        playerPosition: { x: 1, y: 1 },
        inDungeon: false
    });
    
    return {
        subscribe,
        startDungeon: (sessionId, maze, enemies, character) => {
            set({
                sessionId,
                maze,
                character,
                enemies,
                playerPosition: { x: 1, y: 1 },
                inDungeon: true
            });
        },
        updatePlayerPosition: (position) => {
            update(state => ({
                ...state,
                playerPosition: position
            }));
        },
        updateEnemies: (enemies) => {
            update(state => ({
                ...state,
                enemies
            }));
        },
        leaveDungeon: () => {
            set({
                sessionId: null,
                maze: null,
                character: null,
                enemies: [],
                playerPosition: { x: 1, y: 1 },
                inDungeon: false
            });
        }
    };
}

export const gameStore = createGameStore();
