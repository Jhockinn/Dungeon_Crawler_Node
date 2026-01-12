import { fetchAPI } from './api';


export async function verifyEmail(token) {
    return fetchAPI('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token })
    });
}

export async function resendVerification(email) {
    return fetchAPI('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
}

export async function forgotPassword(email) {
    return fetchAPI('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
}

export async function resetPassword(token, newPassword) {
    return fetchAPI('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
    });
}
