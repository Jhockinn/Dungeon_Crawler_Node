const nodemailer = require('nodemailer');
const crypto = require('crypto');
const pool = require('../config/database');
const { buildClientUrl } = require('./urlHelper');

let transporter = null;

// Creates email transporter (Gmail if configured, else Ethereal test account)
const createTransporter = async () => {
    if (transporter) return transporter;

    const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (hasGmailConfig) {
        console.log('📧 Using Gmail SMTP with:', process.env.EMAIL_USER);
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log('✅ Gmail transporter created');
    } else {
        console.log('📧 Creating Ethereal test email account...');
        const testAccount = await nodemailer.createTestAccount();

        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });

        console.log('✅ Ethereal account created:', testAccount.user);
        console.log('⚠️  To use Gmail instead, set EMAIL_USER and EMAIL_PASS in .env');
    }

    return transporter;
};

// Generates random token for email verification or password reset
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Sends verification email with token link (expires in 24 hours)
const sendVerificationEmail = async (user) => {
    try {
        const transporter = await createTransporter();
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await pool.query(
            `INSERT INTO email_verification_tokens (user_id, token, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, token, expiresAt]
        );

        const verificationUrl = buildClientUrl(`/verify-email?token=${token}`);

        const info = await transporter.sendMail({
            from: '"Dungeon Crawler" <noreply@dungeoncrawler.com>',
            to: user.email,
            subject: 'Verify Your Email - Dungeon Crawler',
            html: `
                <h1>Welcome to Dungeon Crawler, ${user.username}!</h1>
                <p>Please verify your email address by clicking the link below:</p>
                <a href="${verificationUrl}" style="
                    background-color: #4CAF50;
                    color: white;
                    padding: 14px 20px;
                    text-decoration: none;
                    display: inline-block;
                    border-radius: 4px;
                ">Verify Email</a>
                <p>Or copy this link: ${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create this account, please ignore this email.</p>
            `
        });

        if (process.env.NODE_ENV !== 'production') {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log('📬 Email sent!');
            console.log('🔗 Preview URL:', previewUrl);
            console.log('   (Open this in your browser to see the email)');
        }

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Send verification email error:', error);
        throw error;
    }
};

// Sends password reset email with token link (expires in 1 hour)
const sendPasswordResetEmail = async (user) => {
    try {
        const transporter = await createTransporter();
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await pool.query(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at, used)
             VALUES ($1, $2, $3, false)`,
            [user.id, token, expiresAt]
        );

        const resetUrl = buildClientUrl(`/reset-password?token=${token}`);

        const info = await transporter.sendMail({
            from: '"Dungeon Crawler" <noreply@dungeoncrawler.com>',
            to: user.email,
            subject: 'Reset Your Password - Dungeon Crawler',
            html: `
                <h1>Password Reset Request</h1>
                <p>Hi ${user.username},</p>
                <p>You requested to reset your password. Click the link below:</p>
                <a href="${resetUrl}" style="
                    background-color: #2196F3;
                    color: white;
                    padding: 14px 20px;
                    text-decoration: none;
                    display: inline-block;
                    border-radius: 4px;
                ">Reset Password</a>
                <p>Or copy this link: ${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        if (process.env.NODE_ENV !== 'production') {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log('📬 Password reset email sent!');
            console.log('🔗 Preview URL:', previewUrl);
        }

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Send password reset email error:', error);
        throw error;
    }
};

// Verifies email token and marks user as verified
const verifyEmailToken = async (token) => {
    try {
        const result = await pool.query(
            `SELECT evt.*, u.id as user_id, u.username, u.email
             FROM email_verification_tokens evt
             JOIN users u ON evt.user_id = u.id
             WHERE evt.token = $1 AND evt.expires_at > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return { valid: false, message: 'Invalid or expired token' };
        }

        const user = result.rows[0];

        await pool.query(
            'UPDATE users SET email_verified = true WHERE id = $1',
            [user.user_id]
        );

        await pool.query(
            'DELETE FROM email_verification_tokens WHERE token = $1',
            [token]
        );

        return { valid: true, userId: user.user_id };
    } catch (error) {
        console.error('Verify email token error:', error);
        throw error;
    }
};

// Verifies password reset token is valid and not expired
const verifyPasswordResetToken = async (token) => {
    try {
        const result = await pool.query(
            `SELECT prt.*, u.id as user_id, u.username, u.email
             FROM password_reset_tokens prt
             JOIN users u ON prt.user_id = u.id
             WHERE prt.token = $1
             AND prt.expires_at > NOW()
             AND prt.used = false`,
            [token]
        );

        if (result.rows.length === 0) {
            return { valid: false, message: 'Invalid or expired token' };
        }

        return { valid: true, user: result.rows[0] };
    } catch (error) {
        console.error('Verify password reset token error:', error);
        throw error;
    }
};

// Marks password reset token as used to prevent reuse
const markTokenAsUsed = async (token) => {
    try {
        await pool.query(
            'UPDATE password_reset_tokens SET used = true WHERE token = $1',
            [token]
        );
    } catch (error) {
        console.error('Mark token as used error:', error);
        throw error;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    verifyEmailToken,
    verifyPasswordResetToken,
    markTokenAsUsed
};
