export const ROUTES = {
    LOGIN: '/',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    VERIFY_EMAIL: '/verify-email',
    RESET_PASSWORD: '/reset-password',
    GAME: '/game'
};

export function getCurrentRoute() {
    const path = window.location.pathname;

    if (path.includes('/verify-email')) return ROUTES.VERIFY_EMAIL;
    if (path.includes('/reset-password')) return ROUTES.RESET_PASSWORD;

    switch (path) {
        case '/':
            return ROUTES.LOGIN;
        case '/register':
            return ROUTES.REGISTER;
        case '/forgot-password':
            return ROUTES.FORGOT_PASSWORD;
        case '/game':
            return ROUTES.GAME;
        default:
            return ROUTES.LOGIN;
    }
}

export function navigateTo(route, state = {}) {
    window.history.pushState(state, '', route);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export function getQueryParams() {
    return new URLSearchParams(window.location.search);
}

export function getPathParam(pattern, paramName) {
    const path = window.location.pathname;
    const regex = new RegExp(pattern.replace(':' + paramName, '([^/]+)'));
    const match = path.match(regex);
    return match ? match[1] : null;
}
