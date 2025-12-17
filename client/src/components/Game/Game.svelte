<script>
  import { onMount, onDestroy } from 'svelte';
  import { connectSocket, disconnectSocket } from '../../services/socketService';
  import CharacterSelect from '../Character/CharacterSelect.svelte';
  import CharacterCreate from '../Character/CharacterCreate.svelte';
  import DungeonGame from './DungeonGame.svelte';

  let socket;
  let currentView = 'select'; // 'select', 'create', 'game'
  let selectedCharacter = null;

  onMount(() => {
    socket = connectSocket();
  });

  onDestroy(() => {
    disconnectSocket();
  });

  function handleCharacterSelect(event) {
    selectedCharacter = event.detail;
    currentView = 'game';
  }

  function handleCreateCharacter() {
    currentView = 'create';
  }

  function handleCharacterCreated() {
    currentView = 'select';
  }

  function handleCancelCreate() {
    currentView = 'select';
  }

  function handleBackToSelect() {
    selectedCharacter = null;
    currentView = 'select';
  }
</script>

<div class="game-container">
  {#if currentView === 'select'}
    <CharacterSelect 
      on:select={handleCharacterSelect}
      on:create={handleCreateCharacter}
    />
  {:else if currentView === 'create'}
    <CharacterCreate 
      on:created={handleCharacterCreated}
      on:cancel={handleCancelCreate}
    />
  {:else if currentView === 'game' && selectedCharacter}
    <div class="game-header">
      <button on:click={handleBackToSelect}>← Back to Characters</button>
    </div>
    <DungeonGame character={selectedCharacter} />
  {/if}
</div>

<style>
  .game-container {
    width: 100%;
    min-height: 100vh;
  }

  .game-header {
    padding: 1em;
    margin-bottom: 1em;
  }

  .game-header button {
    background-color: #333;
    border-color: #333;
  }

  .game-header button:hover {
    background-color: #444;
  }
</style>
