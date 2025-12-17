exports.authenticateToken = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated. Please login.' });
    }
    
    req.user = {
        userId: req.session.userId,
        username: req.session.username,
        email: req.session.email
    };
    
    next();
};

exports.requireAuth = exports.authenticateToken;

exports.requireGuest = (req, res, next) => {
    if (req.session.userId) {
        return res.status(400).json({ error: 'Already logged in' });
    }
    next();
};
