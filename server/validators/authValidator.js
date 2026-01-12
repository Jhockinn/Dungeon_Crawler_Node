const validateUsername = (username) => {
    const errors = [];

    if (!username) {
        errors.push('Username is required');
        return { valid: false, errors };
    }

    if (typeof username !== 'string') {
        errors.push('Username must be a string');
        return { valid: false, errors };
    }

    const trimmed = username.trim();

    if (trimmed.length < 3) {
        errors.push('Username must be at least 3 characters');
    }

    if (trimmed.length > 20) {
        errors.push('Username must be at most 20 characters');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        errors.push('Username can only contain letters, numbers, and underscores');
    }

    if (!/^[a-zA-Z]/.test(trimmed)) {
        errors.push('Username must start with a letter');
    }

    return {
        valid: errors.length === 0,
        errors,
        value: trimmed
    };
};

const validateEmail = (email) => {
    const errors = [];

    if (!email) {
        errors.push('Email is required');
        return { valid: false, errors };
    }

    if (typeof email !== 'string') {
        errors.push('Email must be a string');
        return { valid: false, errors };
    }

    const trimmed = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        errors.push('Invalid email format');
    }

    if (trimmed.length > 100) {
        errors.push('Email must be at most 100 characters');
    }

    return {
        valid: errors.length === 0,
        errors,
        value: trimmed
    };
};

const validatePassword = (password) => {
    const errors = [];

    if (!password) {
        errors.push('Password is required');
        return { valid: false, errors };
    }

    if (typeof password !== 'string') {
        errors.push('Password must be a string');
        return { valid: false, errors };
    }

    if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    if (password.length > 100) {
        errors.push('Password must be at most 100 characters');
    }

    return {
        valid: errors.length === 0,
        errors,
        value: password
    };
};

const validateRegistration = (data) => {
    const { username, email, password } = data;

    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    const allErrors = [
        ...usernameValidation.errors,
        ...emailValidation.errors,
        ...passwordValidation.errors
    ];

    return {
        valid: allErrors.length === 0,
        errors: allErrors,
        values: {
            username: usernameValidation.value,
            email: emailValidation.value,
            password: passwordValidation.value
        }
    };
};

const validateLogin = (data) => {
    const { email, password } = data;

    const emailValidation = validateEmail(email);
    const errors = [...emailValidation.errors];

    if (!password) {
        errors.push('Password is required');
    }

    return {
        valid: errors.length === 0,
        errors,
        values: {
            email: emailValidation.value,
            password
        }
    };
};

module.exports = {
    validateUsername,
    validateEmail,
    validatePassword,
    validateRegistration,
    validateLogin
};
