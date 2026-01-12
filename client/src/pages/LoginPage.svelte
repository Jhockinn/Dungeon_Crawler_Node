<script>
  import { createEventDispatcher } from 'svelte';
  import Login from '../components/Auth/Login.svelte';

  const dispatch = createEventDispatcher();

  function handleSuccess() {
    dispatch('success');
  }

  function handleForgotPassword() {
    dispatch('forgotPassword');
  }

  function handleRegister() {
    dispatch('register');
  }
</script>

<div class="login-page">
  <div class="login-card">
    <Login on:success={handleSuccess} />

    <div class="auth-actions">
      <button
        type="button"
        class="forgot-password-link"
        on:click={handleForgotPassword}
      >
        Forgot Password?
      </button>
    </div>

    <p class="switch-view">
      Don't have an account?
      <button class="link-btn" on:click={handleRegister}>
        Register here
      </button>
    </p>
  </div>
</div>

<style>
  .login-page {
    max-width: 500px;
    margin: 0 auto;
    padding: 2em;
  }

  .login-card {
    background-color: #1a1a1a;
    border-radius: 8px;
    padding: 2em;
  }

  .auth-actions {
    margin-top: 1em;
    text-align: center;
  }

  .forgot-password-link {
    background: none;
    border: none;
    color: #888;
    font-size: 0.9em;
    cursor: pointer;
    text-decoration: underline;
    padding: 0.5em;
  }

  .forgot-password-link:hover {
    color: #aaa;
  }

  .switch-view {
    margin-top: 1.5em;
    text-align: center;
    color: #ccc;
  }

  .link-btn {
    background: none;
    border: none;
    color: #646cff;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
  }

  .link-btn:hover {
    color: #8080ff;
  }
</style>
