<script>
  import { onMount } from 'svelte';
  import { verifyEmail, resendVerification } from '../services/authService';
  import { navigateTo, ROUTES, getQueryParams, getPathParam } from '../utils/router';

  let token = '';
  let verifying = true;
  let success = false;
  let error = '';
  let countdown = 3;

  async function initVerification() {
    token = extractToken();

    if (!token) {
      error = 'No verification token found. Please check your email and click the verification link.';
      verifying = false;
      return;
    }

    await handleVerify();
  }

  onMount(() => {
    initVerification();
  });

  function extractToken() {
    const params = getQueryParams();
    let tokenValue = params.get('token');

    if (!tokenValue) {
      const pathParts = window.location.pathname.split('/');
      const tokenIndex = pathParts.indexOf('verify-email') + 1;
      if (tokenIndex > 0 && tokenIndex < pathParts.length) {
        tokenValue = pathParts[tokenIndex];
      }
    }

    return tokenValue || '';
  }

  async function handleVerify() {
    verifying = true;
    error = '';

    try {
      await verifyEmail(token);
      success = true;
      startCountdown();
    } catch (err) {
      error = err.message || 'Verification failed';

      if (error.includes('expired')) {
        error = 'Verification link has expired. Please request a new one.';
      } else if (error.includes('invalid')) {
        error = 'Invalid verification link. Please check your email.';
      }
    } finally {
      verifying = false;
    }
  }

  function startCountdown() {
    const interval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(interval);
        navigateTo(ROUTES.LOGIN);
      }
    }, 1000);
  }

  async function handleResend() {
    error = 'Resend functionality requires your email address.';
  }
</script>

<div class="verify-container">
  {#if verifying}
    <div class="loading">
      <div class="spinner"></div>
      <p>Verifying your email...</p>
    </div>
  {:else if success}
    <div class="success">
      <div class="icon">✅</div>
      <h2>Email Verified!</h2>
      <p>Your email has been successfully verified.</p>
      <p>Redirecting to login in {countdown} seconds...</p>
      <button on:click={() => navigateTo(ROUTES.LOGIN)}>
        Go to Login Now
      </button>
    </div>
  {:else if error}
    <div class="error-container">
      <div class="icon">❌</div>
      <h2>Verification Failed</h2>
      <p>{error}</p>
      <div class="actions">
        <button on:click={() => navigateTo(ROUTES.LOGIN)}>
          Go to Login
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .verify-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 2em;
  }

  .loading, .success, .error-container {
    background-color: #1a1a1a;
    border-radius: 8px;
    padding: 3em 2em;
    text-align: center;
  }

  .spinner {
    border: 4px solid #333;
    border-top: 4px solid #646cff;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1em;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .icon {
    font-size: 4em;
    margin-bottom: 0.5em;
  }

  h2 {
    color: #ffd700;
    margin-bottom: 1em;
  }

  p {
    margin: 0.5em 0;
    color: #ccc;
  }

  .actions {
    margin-top: 2em;
    display: flex;
    gap: 1em;
    justify-content: center;
  }

  button {
    padding: 0.75em 1.5em;
  }
</style>
