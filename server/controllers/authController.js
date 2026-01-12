const pool = require('../config/database');
const bcrypt = require('bcrypt');
const emailService = require('../utils/emailService');
const { validateRegistration, validateLogin } = require('../validators/authValidator');

// Registers new user, sends verification email
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const validation = validateRegistration({ username, email, password });
        if (!validation.valid) {
            return res.status(400).json({
                error: validation.errors.join(', '),
                errors: validation.errors
            });
        }

        const validatedData = validation.values;

        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [validatedData.username, validatedData.email, hashedPassword]
        );

        const user = result.rows[0];

        try {
            await emailService.sendVerificationEmail(user);
            console.log('✅ Verification email sent to:', user.email);
        } catch (emailError) {
            console.error('⚠️ Failed to send verification email:', emailError.message);
        }

        res.status(201).json({
            message: 'User created successfully. Please check your email to verify your account.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);

        if (error.code === '23505') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        res.status(500).json({ error: 'Failed to register user' });
    }
};

// Authenticates user and creates session
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const validation = validateLogin({ email, password });
        if (!validation.valid) {
            return res.status(400).json({
                error: validation.errors.join(', '),
                errors: validation.errors
            });
        }

        const validatedEmail = validation.values.email;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [validatedEmail]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.email = user.email;

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};

// Destroys session and clears cookie
exports.logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }

        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
};

// Returns current authenticated user data
exports.getCurrentUser = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const result = await pool.query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
};

// Verifies email using token from email link
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        const result = await emailService.verifyEmailToken(token);

        if (!result.valid) {
            return res.status(400).json({ error: result.message });
        }

        res.json({
            message: 'Email verified successfully!',
            userId: result.userId
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
};

// Resends verification email to user
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.json({ message: 'If an account exists with that email, a verification link has been sent.' });
        }

        const user = result.rows[0];

        if (user.email_verified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [user.id]);

        await emailService.sendVerificationEmail(user);

        res.json({ message: 'Verification email has been sent!' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to send verification email' });
    }
};

// Sends password reset email with token link
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
        }

        const user = result.rows[0];

        await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

        await emailService.sendPasswordResetEmail(user);

        res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
};

// Resets password using token from email link
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const verifyResult = await emailService.verifyPasswordResetToken(token);

        if (!verifyResult.valid) {
            return res.status(400).json({ error: verifyResult.message });
        }

        const user = verifyResult.user;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, user.user_id]
        );

        await emailService.markTokenAsUsed(token);

        res.json({ message: 'Password has been reset successfully!' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
