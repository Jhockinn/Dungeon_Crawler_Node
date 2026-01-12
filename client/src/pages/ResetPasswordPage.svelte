<script>
  import { onMount } from 'svelte';
  import ResetPassword from '../components/Auth/ResetPassword.svelte';
  import { navigateTo, ROUTES, getQueryParams } from '../utils/router';

  let token = '';
  let error = '';

  onMount(() => {
    const params = getQueryParams();
    token = params.get('token') || '';

    if (!token) {
      error = 'No reset token found. Please request a new password reset link.';
    }
  });

  function handleSuccess() {
    navigateTo(ROUTES.LOGIN);
  }
</script>

<div class="reset-password-page">
  {#if error}
    <div class="error-card">
      <h2>Invalid Link</h2>
      <p>{error}</p>
      <button on:click={() => navigateTo(ROUTES.FORGOT_PASSWORD)}>
        Request New Link
      </button>
    </div>
  {:else}
    <div class="reset-password-card">
      <ResetPassword {token} on:success={handleSuccess} />
    </div>
  {/if}
</div>

<style>
  .reset-password-page {
    max-width: 500px;
    margin: 0 auto;
    padding: 2em;
  }

  .reset-password-card, .error-card {
    background-color: #1a1a1a;
    border-radius: 8px;
    padding: 2em;
  }

  .error-card {
    text-align: center;
  }

  .error-card h2 {
    color: #ff4444;
    margin-bottom: 1em;
  }

  .error-card p {
    margin-bottom: 2em;
    color: #ccc;
  }
</style>
