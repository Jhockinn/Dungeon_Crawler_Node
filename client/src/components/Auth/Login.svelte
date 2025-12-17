<script>
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '../../stores/authStore';
  import { login } from '../../services/api';

  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleLogin() {
    error = '';
    loading = true;

    try {
      const response = await login(email, password);
      authStore.login(response.user);
      dispatch('success');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-container">
  <h2>Login</h2>
  
  <form on:submit|preventDefault={handleLogin}>
    <div class="form-group">
      <label for="email">Email:</label>
      <input 
        type="email" 
        id="email" 
        bind:value={email} 
        required 
        disabled={loading}
        placeholder="your.email@example.com"
      />
    </div>

    <div class="form-group">
      <label for="password">Password:</label>
      <input 
        type="password" 
        id="password" 
        bind:value={password} 
        required 
        disabled={loading}
        placeholder="Enter your password"
      />
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <button type="submit" disabled={loading}>
      {loading ? 'Logging in...' : 'Login'}
    </button>
  </form>
</div>

<style>
  .login-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 2em;
    background-color: #1a1a1a;
    border-radius: 8px;
  }

  h2 {
    text-align: center;
    margin-bottom: 1.5em;
    color: #ffd700;
  }

  .form-group {
    margin-bottom: 1em;
    text-align: left;
  }

  label {
    display: block;
    margin-bottom: 0.5em;
  }

  input {
    width: 100%;
  }

  .error {
    color: #ff4444;
    margin: 1em 0;
    text-align: center;
  }

  button[type="submit"] {
    width: 100%;
    margin-top: 1em;
  }
</style>
