<script>
  import { onMount } from 'svelte';
  import { authStore } from './stores/authStore';
  import { getCurrentUser } from './services/api';
  import { getCurrentRoute, navigateTo, ROUTES } from './utils/router';
  import LoginPage from './pages/LoginPage.svelte';
  import RegisterPage from './pages/RegisterPage.svelte';
  import ForgotPasswordPage from './pages/ForgotPasswordPage.svelte';
  import VerifyEmailPage from './pages/VerifyEmailPage.svelte';
  import ResetPasswordPage from './pages/ResetPasswordPage.svelte';
  import GamePage from './pages/GamePage.svelte';

  let currentRoute = ROUTES.LOGIN;

  onMount(async () => {
    currentRoute = getCurrentRoute();

    if ([ROUTES.VERIFY_EMAIL, ROUTES.RESET_PASSWORD].includes(currentRoute)) {
      authStore.setLoading(false);
      return;
    }

    try {
      authStore.setLoading(true);
      const response = await getCurrentUser();
      authStore.setUser(response.user);

      if (![ROUTES.GAME].includes(currentRoute)) {
        currentRoute = ROUTES.GAME;
        navigateTo(ROUTES.GAME);
      }
    } catch (error) {
      authStore.setUser(null);
      if (currentRoute === ROUTES.GAME) {
        currentRoute = ROUTES.LOGIN;
        navigateTo(ROUTES.LOGIN);
      }
    } finally {
      authStore.setLoading(false);
    }
  });

  function handleLoginSuccess() {
    currentRoute = ROUTES.GAME;
    navigateTo(ROUTES.GAME);
  }

  function handleShowRegister() {
    currentRoute = ROUTES.REGISTER;
    navigateTo(ROUTES.REGISTER);
  }

  function handleShowForgotPassword() {
    currentRoute = ROUTES.FORGOT_PASSWORD;
    navigateTo(ROUTES.FORGOT_PASSWORD);
  }

  function handleBackToLogin() {
    currentRoute = ROUTES.LOGIN;
    navigateTo(ROUTES.LOGIN);
  }

  async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      try {
        const { logout } = await import('./services/api');
        await logout();
        authStore.logout();
        currentRoute = ROUTES.LOGIN;
        navigateTo(ROUTES.LOGIN);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  }
</script>

<main>
  {#if $authStore.loading}
    <div class="loading-screen">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  {:else if $authStore.isAuthenticated && currentRoute === ROUTES.GAME}
    <div class="app-header">
      <h1>🏰 Dungeon Crawler</h1>
      <div class="user-info">
        <span>Welcome, {$authStore.user?.username}!</span>
        <button class="logout-btn" on:click={handleLogout}>Logout</button>
      </div>
    </div>

    <GamePage />
  {:else}
    <div class="auth-container">
      <h1>🏰 Dungeon Crawler</h1>

      {#if currentRoute === ROUTES.LOGIN}
        <LoginPage
          on:success={handleLoginSuccess}
          on:forgotPassword={handleShowForgotPassword}
          on:register={handleShowRegister}
        />
      {:else if currentRoute === ROUTES.REGISTER}
        <RegisterPage
          on:success={handleBackToLogin}
          on:login={handleBackToLogin}
        />
      {:else if currentRoute === ROUTES.FORGOT_PASSWORD}
        <ForgotPasswordPage on:cancel={handleBackToLogin} />
      {:else if currentRoute === ROUTES.VERIFY_EMAIL}
        <VerifyEmailPage />
      {:else if currentRoute === ROUTES.RESET_PASSWORD}
        <ResetPasswordPage />
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    min-height: 100vh;
    width: 100%;
  }

  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  .spinner {
    border: 4px solid #333;
    border-top: 4px solid #646cff;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin-bottom: 1em;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1em 2em;
    background-color: #1a1a1a;
    border-bottom: 2px solid #333;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .app-header h1 {
    margin: 0;
    font-size: 2em;
    color: #ffd700;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1em;
  }

  .logout-btn {
    background-color: #f44336;
    border-color: #f44336;
  }

  .logout-btn:hover {
    background-color: #da190b;
  }

  .auth-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 2em;
    text-align: center;
    padding-top: 5em;
  }

  .auth-container h1 {
    font-size: 3em;
    margin-bottom: 1.5em;
    color: #ffd700;
  }
</style>
