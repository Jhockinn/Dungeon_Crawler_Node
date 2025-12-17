import { writable } from 'svelte/store';

function createAuthStore() {
    const { subscribe, set, update } = writable({
        user: null,
        isAuthenticated: false,
        loading: true
    });
    
    return {
        subscribe,
        login: (userData) => {
            set({ 
                user: userData, 
                isAuthenticated: true,
                loading: false
            });
        },
        logout: () => {
            set({ 
                user: null, 
                isAuthenticated: false,
                loading: false
            });
        },
        setUser: (userData) => {
            set({
                user: userData,
                isAuthenticated: !!userData,
                loading: false
            });
        },
        setLoading: (loading) => {
            update(state => ({
                ...state,
                loading
            }));
        }
    };
}

export const authStore = createAuthStore();
