<script>
  import { onMount } from 'svelte';
  import { authStore } from './stores/authStore';
  import { getCurrentUser } from './services/api';
  import Login from './components/Auth/Login.svelte';
  import Register from './components/Auth/Register.svelte';
  import ForgotPassword from './components/Auth/ForgotPassword.svelte';
  import VerifyEmail from './components/Auth/VerifyEmail.svelte';
  import ResetPassword from './components/Auth/ResetPassword.svelte';
  import Game from './components/Game/Game.svelte';

  let currentView = 'login'; // 'login', 'register', 'game', 'forgotPassword', 'verifyEmail', 'resetPassword'

  // Check if user is already logged in (session exists)
  onMount(async () => {
    // Check for special routes in URL
    const params = new URLSearchParams(window.location.search);
    
    if (window.location.pathname.includes('/verify-email') || params.has('token')) {
      currentView = 'verifyEmail';
      return;
    }
    
    if (window.location.pathname.includes('/reset-password')) {
      currentView = 'resetPassword';
      return;
    }

    try {
      authStore.setLoading(true);
      const response = await getCurrentUser();
      authStore.setUser(response.user);
      currentView = 'game';
    } catch (error) {
      // Not logged in, stay on login page
      authStore.setUser(null);
    } finally {
      authStore.setLoading(false);
    }
  });

  function showLogin() {
    currentView = 'login';
    window.history.pushState({}, '', '/');
  }

  function showRegister() {
    currentView = 'register';
  }

  function showGame() {
    currentView = 'game';
  }

  function showForgotPassword() {
    currentView = 'forgotPassword';
  }

  async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      try {
        const { logout } = await import('./services/api');
        await logout();
        authStore.logout();
        currentView = 'login';
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
  {:else if $authStore.isAuthenticated && currentView === 'game'}
    <div class="app-header">
      <h1>🏰 Dungeon Crawler</h1>
      <div class="user-info">
        <span>Welcome, {$authStore.user?.username}!</span>
        <button class="logout-btn" on:click={handleLogout}>Logout</button>
      </div>
    </div>
    
    <Game />
  {:else}
    <div class="auth-container">
      <h1>🏰 Dungeon Crawler</h1>
      
      {#if currentView === 'login'}
        <Login 
          on:success={showGame}
          on:forgotPassword={showForgotPassword}
        />
        <p class="switch-view">
          Don't have an account? 
          <button class="link-btn" on:click={showRegister}>Register here</button>
        </p>
      {:else if currentView === 'register'}
        <Register on:success={showLogin} />
        <p class="switch-view">
          Already have an account? 
          <button class="link-btn" on:click={showLogin}>Login here</button>
        </p>
      {:else if currentView === 'forgotPassword'}
        <ForgotPassword on:cancel={showLogin} />
      {:else if currentView === 'verifyEmail'}
        <VerifyEmail />
      {:else if currentView === 'resetPassword'}
        <ResetPassword />
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

  .switch-view {
    margin-top: 1.5em;
    text-align: center;
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
