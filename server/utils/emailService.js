const nodemailer = require('nodemailer');
const crypto = require('crypto');
const pool = require('../config/database');

// Create email transporter
const createTransporter = () => {
    // For development, use Ethereal (fake email service)
    // For production, use real email service (Gmail, SendGrid, etc.)
    
    if (process.env.NODE_ENV === 'production') {
        // Real email service
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    } else {
        // For development/testing - logs to console
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: process.env.EMAIL_USER || 'test@ethereal.email',
                pass: process.env.EMAIL_PASSWORD || 'test'
            }
        });
    }
};

// Generate random token
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send verification email
exports.sendVerificationEmail = async (user) => {
    try {
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Store token in database
        await pool.query(
            'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, token, expiresAt]
        );
        
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
        
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Dungeon Crawler" <noreply@dungeoncrawler.com>',
            to: user.email,
            subject: 'Verify Your Email - Dungeon Crawler',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #ffd700;">🏰 Welcome to Dungeon Crawler!</h1>
                    <p>Hi ${user.username},</p>
                    <p>Thank you for registering! Please verify your email address to activate your account.</p>
                    <p style="margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 4px; display: inline-block;">
                            Verify Email
                        </a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                    </p>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        
        // For development, log the preview URL
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            console.log('Verification link:', verificationUrl);
        }
        
        return true;
    } catch (error) {
        console.error('Send verification email error:', error);
        throw error;
    }
};

// Send password reset email
exports.sendPasswordResetEmail = async (user) => {
    try {
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        
        // Store token in database
        await pool.query(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, token, expiresAt]
        );
        
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
        
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Dungeon Crawler" <noreply@dungeoncrawler.com>',
            to: user.email,
            subject: 'Reset Your Password - Dungeon Crawler',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #ffd700;">🏰 Password Reset Request</h1>
                    <p>Hi ${user.username},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <p style="margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #f44336; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 4px; display: inline-block;">
                            Reset Password
                        </a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                    </p>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log('Password reset email sent:', info.messageId);
        
        // For development, log the preview URL
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            console.log('Reset link:', resetUrl);
        }
        
        return true;
    } catch (error) {
        console.error('Send password reset email error:', error);
        throw error;
    }
};

// Verify email token
exports.verifyEmailToken = async (token) => {
    try {
        const result = await pool.query(
            `SELECT vt.*, u.id as user_id, u.email 
             FROM email_verification_tokens vt
             JOIN users u ON vt.user_id = u.id
             WHERE vt.token = $1 AND vt.expires_at > NOW()`,
            [token]
        );
        
        if (result.rows.length === 0) {
            return { valid: false, message: 'Invalid or expired token' };
        }
        
        const tokenData = result.rows[0];
        
        // Update user as verified
        await pool.query(
            'UPDATE users SET email_verified = TRUE WHERE id = $1',
            [tokenData.user_id]
        );
        
        // Delete used token
        await pool.query(
            'DELETE FROM email_verification_tokens WHERE token = $1',
            [token]
        );
        
        return { valid: true, userId: tokenData.user_id };
    } catch (error) {
        console.error('Verify email token error:', error);
        throw error;
    }
};

// Verify password reset token
exports.verifyPasswordResetToken = async (token) => {
    try {
        const result = await pool.query(
            `SELECT rt.*, u.id as user_id, u.email, u.username
             FROM password_reset_tokens rt
             JOIN users u ON rt.user_id = u.id
             WHERE rt.token = $1 AND rt.expires_at > NOW() AND rt.used = FALSE`,
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

// Mark password reset token as used
exports.markTokenAsUsed = async (token) => {
    await pool.query(
        'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
        [token]
    );
};
