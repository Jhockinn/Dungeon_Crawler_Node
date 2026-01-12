<script>
  import { createEventDispatcher } from 'svelte';
  import ForgotPassword from '../components/Auth/ForgotPassword.svelte';

  const dispatch = createEventDispatcher();

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="forgot-password-page">
  <div class="forgot-password-card">
    <ForgotPassword on:cancel={handleCancel} />
  </div>
</div>

<style>
  .forgot-password-page {
    max-width: 500px;
    margin: 0 auto;
    padding: 2em;
  }

  .forgot-password-card {
    background-color: #1a1a1a;
    border-radius: 8px;
    padding: 2em;
  }
</style>
