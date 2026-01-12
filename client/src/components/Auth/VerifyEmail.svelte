<script>
  import { onMount } from 'svelte';
  import { verifyEmail } from '../../services/authService';

  export let token = '';
  
  let verifying = true;
  let success = false;
  let error = '';

  onMount(async () => {
    if (!token) {
      const params = new URLSearchParams(window.location.search);
      token = params.get('token') || '';
    }

    if (!token) {
      error = 'No verification token provided';
      verifying = false;
      return;
    }

    await handleVerify();
  });

  async function handleVerify() {
    verifying = true;
    error = '';

    try {
      const response = await verifyEmail(token);
      success = true;

      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      error = err.message;
    } finally {
      verifying = false;
    }
  }
</script>

<div class="verify-container">
  <div class="verify-card">
    <h2>📧 Email Verification</h2>
    
    {#if verifying}
      <div class="loading">
        <div class="spinner"></div>
        <p>Verifying your email...</p>
      </div>
    {:else if success}
      <div class="success">
        <div class="icon">✅</div>
        <h3>Email Verified!</h3>
        <p>Your email has been successfully verified.</p>
        <p>Redirecting to login...</p>
      </div>
    {:else if error}
      <div class="error-box">
        <div class="icon">❌</div>
        <h3>Verification Failed</h3>
        <p>{error}</p>
        <a href="/">Go to Login</a>
      </div>
    {/if}
  </div>
</div>

<style>
  .verify-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2em;
  }

  .verify-card {
    max-width: 500px;
    width: 100%;
    padding: 3em;
    background-color: #1a1a1a;
    border-radius: 8px;
    text-align: center;
  }

  h2 {
    color: #ffd700;
    margin-bottom: 2em;
  }

  .loading {
    padding: 2em 0;
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

  .success, .error-box {
    padding: 2em 0;
  }

  .icon {
    font-size: 4em;
    margin-bottom: 0.5em;
  }

  h3 {
    color: #ffd700;
    margin-bottom: 1em;
  }

  p {
    margin: 0.5em 0;
    color: #ccc;
  }

  .error-box p {
    color: #ff4444;
  }

  a {
    display: inline-block;
    margin-top: 1.5em;
    padding: 0.75em 2em;
    background-color: #646cff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }

  a:hover {
    background-color: #5555dd;
  }
</style>
