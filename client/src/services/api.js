const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function fetchAPI(endpoint, options = {}) {
    const config = {
        ...options,
        credentials: 'include', // Important: Send cookies with requests
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'API Error');
    }
    
    return response.json();
}

// Auth endpoints
export async function register(username, email, password) {
    return fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
    });
}

export async function login(email, password) {
    return fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

export async function logout() {
    return fetchAPI('/auth/logout', {
        method: 'POST'
    });
}

export async function getCurrentUser() {
    return fetchAPI('/auth/me');
}

// Character endpoints
export async function getCharacters() {
    return fetchAPI('/characters');
}

export async function getCharacter(id) {
    return fetchAPI(`/characters/${id}`);
}

export async function createCharacter(name, characterClass) {
    return fetchAPI('/characters', {
        method: 'POST',
        body: JSON.stringify({ name, class: characterClass })
    });
}

export async function deleteCharacter(id) {
    return fetchAPI(`/characters/${id}`, {
        method: 'DELETE'
    });
}

// Game endpoints
export async function getLeaderboard() {
    return fetchAPI('/game/leaderboard');
}

export async function getEnemyTypes() {
    return fetchAPI('/game/enemy-types');
}
