function normalizeUrl(url) {
    if (!url) return '';

    return url.replace(/\/+$/, '');
}

function getClientUrl() {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return normalizeUrl(clientUrl);
}

function buildClientUrl(path) {
    const baseUrl = getClientUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
}

module.exports = {
    normalizeUrl,
    getClientUrl,
    buildClientUrl
};
