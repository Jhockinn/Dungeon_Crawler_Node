<script>
  import { createEventDispatcher } from 'svelte';
  import { createCharacter } from '../../services/api';

  const dispatch = createEventDispatcher();

  let name = '';
  let selectedClass = 'warrior';
  let error = '';
  let loading = false;

  const classes = [
    { 
      id: 'warrior', 
      name: 'Warrior', 
      icon: '⚔️',
      description: 'High health and defense. Strong in melee combat.',
      stats: { health: 150, attack: 15, defense: 10 }
    },
    { 
      id: 'mage', 
      name: 'Mage', 
      icon: '🔮',
      description: 'Powerful attacks but low defense. Glass cannon.',
      stats: { health: 80, attack: 20, defense: 3 }
    },
    { 
      id: 'rogue', 
      name: 'Rogue', 
      icon: '🗡️',
      description: 'Balanced stats with high attack. Agile fighter.',
      stats: { health: 100, attack: 18, defense: 5 }
    }
  ];

  async function handleCreate() {
    error = '';
    
    if (!name.trim()) {
      error = 'Please enter a character name';
      return;
    }

    loading = true;

    try {
      const character = await createCharacter(name.trim(), selectedClass);
      dispatch('created', character);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="create-character">
  <h2>Create New Character</h2>
  
  <form on:submit|preventDefault={handleCreate}>
    <div class="form-group">
      <label for="name">Character Name:</label>
      <input 
        type="text" 
        id="name" 
        bind:value={name} 
        placeholder="Enter character name"
        disabled={loading}
        maxlength="50"
      />
    </div>

    <fieldset class="form-group">
      <legend>Choose Your Class:</legend>
      <div class="class-selection">
        {#each classes as classOption}
          <button
            type="button"
            class="class-card {selectedClass === classOption.id ? 'selected' : ''}"
            on:click={() => selectedClass = classOption.id}
            aria-pressed={selectedClass === classOption.id}
          >
            <div class="class-icon">{classOption.icon}</div>
            <h3>{classOption.name}</h3>
            <p class="description">{classOption.description}</p>
            <div class="stats">
              <div>❤️ HP: {classOption.stats.health}</div>
              <div>⚔️ ATK: {classOption.stats.attack}</div>
              <div>🛡️ DEF: {classOption.stats.defense}</div>
            </div>
          </button>
        {/each}
      </div>
    </fieldset>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <div class="button-group">
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : '✨ Create Character'}
      </button>
      <button type="button" on:click={() => dispatch('cancel')} disabled={loading}>
        Cancel
      </button>
    </div>
  </form>
</div>

<style>
  .create-character {
    max-width: 900px;
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

  .form-group, fieldset {
    margin-bottom: 2em;
  }

  fieldset {
    border: none;
    padding: 0;
  }

  label, legend {
    display: block;
    margin-bottom: 0.5em;
    font-weight: bold;
  }

  input {
    width: 100%;
    padding: 0.75em;
    font-size: 1.1em;
    border-radius: 4px;
    border: 2px solid #333;
    background-color: #2a2a2a;
    color: white;
  }

  .class-selection {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1em;
  }

  .class-card {
    padding: 1.5em;
    border: 2px solid #333;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    background-color: #2a2a2a;
    text-align: left;
    width: 100%;
    font-family: inherit;
    color: inherit;
  }

  .class-card:hover {
    border-color: #646cff;
    transform: translateY(-2px);
  }

  .class-card:focus {
    outline: 2px solid #646cff;
    outline-offset: 2px;
  }

  .class-card.selected {
    border-color: #ffd700;
    background-color: #3a3a2a;
  }

  .class-icon {
    font-size: 3em;
    text-align: center;
    margin-bottom: 0.5em;
  }

  h3 {
    text-align: center;
    margin-bottom: 0.5em;
    color: #ffd700;
  }

  .description {
    text-align: center;
    font-size: 0.9em;
    color: #ccc;
    margin-bottom: 1em;
    min-height: 2.5em;
  }

  .stats {
    display: flex;
    justify-content: space-around;
    font-size: 0.9em;
    color: #aaa;
  }

  .button-group {
    display: flex;
    gap: 1em;
    justify-content: center;
    margin-top: 2em;
  }

  button {
    padding: 0.75em 2em;
    font-size: 1em;
  }

  .error {
    color: #ff4444;
    text-align: center;
    margin: 1em 0;
  }
</style>