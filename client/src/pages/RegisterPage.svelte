<script>
  import { createEventDispatcher } from 'svelte';
  import Register from '../components/Auth/Register.svelte';

  const dispatch = createEventDispatcher();

  function handleSuccess() {
    dispatch('success');
  }

  function handleLogin() {
    dispatch('login');
  }
</script>

<div class="register-page">
  <div class="register-card">
    <Register on:success={handleSuccess} />

    <p class="switch-view">
      Already have an account?
      <button class="link-btn" on:click={handleLogin}>
        Login here
      </button>
    </p>
  </div>
</div>

<style>
  .register-page {
    max-width: 500px;
    margin: 0 auto;
    padding: 2em;
  }

  .register-card {
    background-color: #1a1a1a;
    border-radius: 8px;
    padding: 2em;
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
