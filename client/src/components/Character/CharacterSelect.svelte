<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { getCharacters, deleteCharacter } from '../../services/api';

  const dispatch = createEventDispatcher();

  let characters = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    await loadCharacters();
  });

  async function loadCharacters() {
    loading = true;
    error = '';
    try {
      characters = await getCharacters();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function selectCharacter(character) {
    dispatch('select', character);
  }

  function createNew() {
    dispatch('create');
  }

  async function handleDelete(characterId) {
    if (confirm('Are you sure you want to delete this character?')) {
      try {
        await deleteCharacter(characterId);
        await loadCharacters();
      } catch (err) {
        error = err.message;
      }
    }
  }

  function getClassIcon(characterClass) {
    const icons = {
      warrior: '⚔️',
      mage: '🔮',
      rogue: '🗡️'
    };
    return icons[characterClass] || '⚔️';
  }
</script>

<div class="character-select">
  <h2>Select Your Character</h2>
  
  {#if loading}
    <p class="loading">Loading characters...</p>
  {:else if error}
    <p class="error">{error}</p>
    <button on:click={loadCharacters}>Retry</button>
  {:else if characters.length === 0}
    <div class="empty-state">
      <p>You don't have any characters yet!</p>
      <button on:click={createNew}>Create Your First Character</button>
    </div>
  {:else}
    <div class="character-grid">
      {#each characters as character}
        <div class="character-card">
          <div class="character-header">
            <div class="class-icon">{getClassIcon(character.class)}</div>
            <div class="character-info">
              <h3>{character.name}</h3>
              <p class="class-name">{character.class}</p>
            </div>
          </div>
          
          <div class="character-stats">
            <div class="stat">
              <span class="label">Level:</span>
              <span class="value">{character.level}</span>
            </div>
            <div class="stat">
              <span class="label">❤️ HP:</span>
              <span class="value">{character.health}/{character.max_health}</span>
            </div>
            <div class="stat">
              <span class="label">⚔️ ATK:</span>
              <span class="value">{character.base_attack}</span>
            </div>
            <div class="stat">
              <span class="label">🛡️ DEF:</span>
              <span class="value">{character.base_defense}</span>
            </div>
            <div class="stat">
              <span class="label">💰 Gold:</span>
              <span class="value">{character.gold}</span>
            </div>
          </div>
          
          <div class="character-actions">
            <button class="play-btn" on:click={() => selectCharacter(character)}>
              Play
            </button>
            <button class="delete-btn" on:click={() => handleDelete(character.id)}>
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
    
    <div class="create-new">
      <button on:click={createNew}>+ Create New Character</button>
    </div>
  {/if}
</div>

<style>
  .character-select {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2em;
  }

  h2 {
    text-align: center;
    color: #ffd700;
    margin-bottom: 2em;
  }

  .loading, .error {
    text-align: center;
    padding: 2em;
  }

  .error {
    color: #ff4444;
  }

  .empty-state {
    text-align: center;
    padding: 3em;
    background-color: #1a1a1a;
    border-radius: 8px;
  }

  .empty-state p {
    font-size: 1.2em;
    margin-bottom: 1.5em;
  }

  .character-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5em;
    margin-bottom: 2em;
  }

  .character-card {
    background-color: #1a1a1a;
    border: 2px solid #333;
    border-radius: 8px;
    padding: 1.5em;
    transition: all 0.3s;
  }

  .character-card:hover {
    border-color: #646cff;
    transform: translateY(-4px);
  }

  .character-header {
    display: flex;
    align-items: center;
    gap: 1em;
    margin-bottom: 1em;
    padding-bottom: 1em;
    border-bottom: 1px solid #333;
  }

  .class-icon {
    font-size: 3em;
  }

  .character-info h3 {
    margin: 0;
    color: #ffd700;
    font-size: 1.5em;
  }

  .class-name {
    margin: 0.25em 0 0 0;
    color: #aaa;
    text-transform: capitalize;
  }

  .character-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5em;
    margin-bottom: 1em;
  }

  .stat {
    display: flex;
    justify-content: space-between;
    padding: 0.5em;
    background-color: #2a2a2a;
    border-radius: 4px;
  }

  .label {
    color: #aaa;
  }

  .value {
    color: #ffd700;
    font-weight: bold;
  }

  .character-actions {
    display: flex;
    gap: 0.5em;
  }

  .play-btn {
    flex: 1;
    background-color: #4CAF50;
    border-color: #4CAF50;
  }

  .play-btn:hover {
    background-color: #45a049;
  }

  .delete-btn {
    background-color: #f44336;
    border-color: #f44336;
  }

  .delete-btn:hover {
    background-color: #da190b;
  }

  .create-new {
    text-align: center;
  }

  .create-new button {
    padding: 1em 2em;
    font-size: 1.1em;
  }
</style>
