<script>
  import { onMount, onDestroy } from 'svelte';
  import { gameStore } from '../../stores/gameStore';
  import toast, { Toaster } from 'svelte-french-toast';
  import { 
    startDungeon, 
    movePlayer, 
    attackEnemy, 
    leaveDungeon,
    onDungeonReady,
    onPlayerMoved,
    onCombatUpdate,
    onEnemyDefeated,
    onEnemyEncounter,
    onPlayerDamaged,
    onPlayerDied,
    onDungeonCompleted,
    onLevelUp
  } from '../../services/socketService';

  export let character;

  let difficulty = 1;
  let sessionId = null;
  let maze = null;
  let enemies = [];
  let playerPos = { x: 1, y: 1 };
  let combatLog = [];
  let selectedEnemy = null;
  let gridKey = 0;
  let exitPoint = null;

  const unsubscribe = gameStore.subscribe(state => {
    sessionId = state.sessionId;
    maze = state.maze;
    enemies = state.enemies;
  });

  onMount(() => {
    onDungeonReady((data) => {
    // console.log('Dungeon ready:', data);
      gameStore.startDungeon(data.sessionId, data.maze, data.enemies, data.character);
      exitPoint = data.exitPoint;
      addLog('Entered the dungeon!');
      toast.success('🏰 Entered the dungeon!');
    });

    onPlayerMoved((data) => {
      // console.log('📍 CLIENT received playerMoved:', data);
      if (data.characterId === character.id) {
        // console.log('✅ Updating position to:', data.position);
        playerPos = { x: data.position.x, y: data.position.y };
        gridKey++;
      }
    });

    onCombatUpdate((data) => {
      // console.log('💥 Combat update received:', data);
      // console.log('📍 Current playerPos:', playerPos);
      // console.log('👤 Current selectedEnemy:', selectedEnemy);
      
      const enemyList = [...enemies];
      const enemy = enemyList.find(e => e.id === data.enemyId);
      
      // console.log('🔍 Found enemy in list:', enemy);
      
      if (enemy) {
        enemy.health = data.health;
        gameStore.updateEnemies(enemyList);
        addLog(`Hit ${enemy.name} for ${data.damage} damage!`);
        enemies = enemyList;
        
      // console.log('✅ After update - enemy:', enemy);
      // console.log('✅ After update - playerPos:', playerPos);
      // console.log('✅ After update - selectedEnemy:', selectedEnemy);
        
        if (selectedEnemy && selectedEnemy.id === data.enemyId) {
          selectedEnemy.health = data.health; 
          selectedEnemy = selectedEnemy;
        }
        
        gridKey++;
        
        // console.log('🎬 After gridKey++ - playerPos:', playerPos);
      }
    });

    onEnemyDefeated((data) => {
      const enemyList = [...enemies];
      const enemy = enemyList.find(e => e.id === data.enemyId);
      if (enemy) {
        enemy.isAlive = false;
        gameStore.updateEnemies(enemyList);
        
        // Update character XP and level
        character.experience = data.currentXP;
        character.level = data.level;
        character.requiredXP = data.requiredXP;
        
        addLog(`💀 Defeated ${enemy.name}! +${data.xpGained} XP (${data.currentXP}/${data.requiredXP})`);
        toast.success(`💀 Defeated ${enemy.name}! +${data.xpGained} XP`);
        
        if (selectedEnemy && selectedEnemy.id === data.enemyId) {
          selectedEnemy = null;
          addLog('✅ You can move again!');
        }
      }
      gridKey++; 
    });

    onEnemyEncounter((data) => {
      // console.log('⚔️ Enemy encounter!', data.enemy);
      selectedEnemy = data.enemy;
      addLog(`⚔️ Encountered ${data.enemy.sprite} ${data.enemy.name}! Press SPACE or click Attack!`);
      toast(`⚔️ Encountered ${data.enemy.name}!`, {
        icon: data.enemy.sprite,
        duration: 2000
      });
      gridKey++;
    });

    onPlayerDamaged((data) => {
      if (data.characterId === character.id) {
        character.health = data.health;
        addLog(`💔 ${data.enemyName} hit you for ${data.damage} damage!`);
        
        if (data.health <= 20) {
          toast.error(`💔 ${data.enemyName} hit you for ${data.damage} damage! (${data.health}/${data.maxHealth} HP)`, {
            duration: 2000
          });
        }
        
        gridKey++; 
      }
    });

    onPlayerDied((data) => {
      if (data.characterId === character.id) {
        character.health = data.health;
        toast.error('💀 You have been defeated!', {
          duration: 4000
        });
        setTimeout(() => {
          toast.success('✨ You have been healed and returned to safety!', {
            duration: 3000
          });
        }, 1000);
        
        setTimeout(() => {
          gameStore.leaveDungeon();
        }, 2000);
      }
    });

    onDungeonCompleted((data) => {
      character.health = data.health;
      toast.success('🎉 ' + data.message, {
        duration: 4000
      });
      setTimeout(() => {
        toast.success('✨ You have been fully healed!', {
          duration: 3000
        });
      }, 1000);
      
      setTimeout(() => {
        gameStore.leaveDungeon();
      }, 2000);
    });

    onLevelUp((data) => {
      character.level = data.newLevel;
      character.experience = data.currentXP;
      character.requiredXP = data.requiredXP;
      character.maxHealth = data.maxHealth;
      character.attack = data.attack;
      character.defense = data.defense;
      
      addLog(`🎊 LEVEL UP! Now level ${data.newLevel}!`);
      addLog(`📈 Stats: +${data.stats.healthIncrease} HP, +${data.stats.attackIncrease} ATK, +${data.stats.defenseIncrease} DEF`);
      
      toast.success(`🎊 LEVEL UP! You're now level ${data.newLevel}!`, {
        duration: 4000
      });
      
      setTimeout(() => {
        toast(`📈 +${data.stats.healthIncrease} HP | +${data.stats.attackIncrease} ATK | +${data.stats.defenseIncrease} DEF`, {
          icon: '⚡',
          duration: 3000
        });
      }, 500);
      
      gridKey++;
    });

    window.addEventListener('keydown', handleKeyPress);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyPress);
    unsubscribe();
  });

  function handleStartDungeon() {
    combatLog = [];
    startDungeon(character.id, difficulty);
  }

  function handleKeyPress(e) {
    if (!sessionId) return;
    
    if (selectedEnemy && selectedEnemy.isAlive) {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleAttack();
      }
      return; 
    }

    const key = e.key.toLowerCase();
    let direction = null;

    if (key === 'w' || key === 'arrowup') direction = 'up';
    else if (key === 's' || key === 'arrowdown') direction = 'down';
    else if (key === 'a' || key === 'arrowleft') direction = 'left';
    else if (key === 'd' || key === 'arrowright') direction = 'right';

    if (direction) {
      e.preventDefault();
      movePlayer(sessionId, character.id, direction);
    }
  }

  function handleAttack() {
    if (selectedEnemy && selectedEnemy.isAlive) {
      attackEnemy(sessionId, character.id, selectedEnemy.id);
    }
  }

  function handleMoveButton(direction) {
    if (selectedEnemy && selectedEnemy.isAlive) {
      addLog('❌ Cannot move while in combat!');
      toast.error('❌ Cannot move while in combat!', {
        duration: 1500
      });
      return;
    }
    
    if (sessionId) {
      movePlayer(sessionId, character.id, direction);
    }
  }

  function handleLeaveDungeon() {
    if (confirm('Are you sure you want to leave the dungeon? You will be healed to full HP.')) {
      leaveDungeon(sessionId, character.id);
      toast.success('✨ Healed to full HP!', {
        duration: 2000
      });
      gameStore.leaveDungeon();
    }
  }

  function addLog(message) {
    combatLog = [...combatLog, { message, time: new Date() }];
    if (combatLog.length > 10) {
      combatLog = combatLog.slice(-10);
    }
  }

  function getCellContent(x, y) {
    if (playerPos.x === x && playerPos.y === y) {
      return { type: 'player', content: '🚶' };
    }

    if (exitPoint && exitPoint.x === x && exitPoint.y === y) {
      return { type: 'exit', content: '🚪' };
    }

    const enemy = enemies.find(e => e.isAlive && e.position.x === x && e.position.y === y);
    if (enemy) {
      return { type: 'enemy', content: enemy.sprite, enemy };
    }

    if (maze[y][x] === 1) {
      return { type: 'wall', content: '🧱' };
    }
    
    return { type: 'floor', content: '' };
  }

  function handleCellClick(x, y, cell) {
    // console.log('Cell clicked:', x, y, cell.type);
    if (cell.type === 'enemy' && cell.enemy) {
      // console.log('Enemy selected:', cell.enemy);
      selectedEnemy = cell.enemy;
    }
  }

  function handleCellKeyDown(e, x, y, cell) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCellClick(x, y, cell);
    }
  }

  function isEnemyInRange(enemy) {
    if (!enemy) return false;
    const dx = Math.abs(enemy.position.x - playerPos.x);
    const dy = Math.abs(enemy.position.y - playerPos.y);
    const inRange = (dx === 0 && dy === 0) || (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    // console.log(`🎯 isEnemyInRange check:`, {
      // enemyPos: enemy.position,
      // playerPos: playerPos,
      // dx, dy,
      // inRange,
      // enemyAlive: enemy.isAlive
    // });
    return inRange;
  }

  $: {
    if (selectedEnemy && !selectedEnemy.isAlive) {
      selectedEnemy = null;
    }
  }
</script>

<Toaster />

<div class="dungeon-game">
  {#if !sessionId}
    <div class="dungeon-setup">
      <h2>🏰 Enter the Dungeon</h2>
      
      <div class="character-info">
        <h3>{character.name} the {character.class}</h3>
        <div class="stats">
          <span>🎖️ Level {character.level || 1}</span>
          <span>❤️ {character.health}/{character.max_health}</span>
          <span>⚔️ {character.base_attack}</span>
          <span>🛡️ {character.base_defense}</span>
        </div>
        {#if character.experience !== undefined && character.requiredXP}
          <div class="xp-bar">
            <div class="xp-progress" style="width: {(character.experience / character.requiredXP) * 100}%"></div>
            <span class="xp-text">XP: {character.experience}/{character.requiredXP}</span>
          </div>
        {/if}
      </div>

      <div class="difficulty-selector">
        <label>
          Difficulty: 
          <input type="range" min="1" max="5" bind:value={difficulty} />
          <span class="difficulty-value">Level {difficulty}</span>
        </label>
      </div>

      <button class="start-btn" on:click={handleStartDungeon}>
        ⚔️ Start Dungeon
      </button>
    </div>
  {:else}
    <div class="game-container">
      <div class="game-header">
        <div class="character-stats">
          <h3>{character.name} - Level {character.level || 1}</h3>
          <div class="stat-bar">
            <span>❤️ {character.health}/{character.max_health}</span>
          </div>
          {#if character.experience !== undefined && character.requiredXP}
            <div class="xp-bar">
              <div class="xp-progress" style="width: {(character.experience / character.requiredXP) * 100}%"></div>
              <span class="xp-text">XP: {character.experience}/{character.requiredXP}</span>
            </div>
          {/if}
        </div>
        <button class="leave-btn" on:click={handleLeaveDungeon}>
          🚪 Leave Dungeon
        </button>
      </div>

      <div class="game-area">
        <div class="dungeon-grid-container">
          {#key gridKey}
            <div class="dungeon-grid" style="grid-template-columns: repeat({maze[0].length}, 30px);">
              {#each maze as row, y}
                {#each row as cell, x}
                  {@const cellData = getCellContent(x, y)}
                  {#if cellData.type === 'enemy'}
                    <div 
                      class="cell {cellData.type}"
                      class:selected={selectedEnemy && cellData.enemy === selectedEnemy}
                      role="button"
                      tabindex="0"
                      on:click={() => handleCellClick(x, y, cellData)}
                      on:keydown={(e) => handleCellKeyDown(e, x, y, cellData)}
                    >
                      {cellData.content}
                    </div>
                  {:else}
                    <div 
                      class="cell {cellData.type}"
                      class:selected={selectedEnemy && cellData.enemy === selectedEnemy}
                    >
                      {cellData.content}
                    </div>
                  {/if}
                {/each}
              {/each}
            </div>
          {/key}
        </div>

        <div class="sidebar">
          <div class="controls">
            <h4>Controls</h4>
            <p>🎮 WASD or Arrow Keys to move</p>
            <p>🖱️ Click enemy to select</p>
            <p>⚔️ SPACE to attack</p>
            <p>🚪 Reach green exit to escape!</p>
            <p>💀 Die = Heal & Return</p>
          </div>

          <div class="movement-pad">
            <h4>Movement</h4>
            {#if selectedEnemy && selectedEnemy.isAlive}
              <p class="combat-notice">⚔️ IN COMBAT!</p>
            {/if}
            <div class="dpad">
              <button 
                class="dpad-btn up" 
                class:disabled={selectedEnemy && selectedEnemy.isAlive}
                on:click={() => handleMoveButton('up')}
              >
                ⬆️
              </button>
              <div class="dpad-middle">
                <button 
                  class="dpad-btn left" 
                  class:disabled={selectedEnemy && selectedEnemy.isAlive}
                  on:click={() => handleMoveButton('left')}
                >
                  ⬅️
                </button>
                <div class="dpad-center"></div>
                <button 
                  class="dpad-btn right" 
                  class:disabled={selectedEnemy && selectedEnemy.isAlive}
                  on:click={() => handleMoveButton('right')}
                >
                  ➡️
                </button>
              </div>
              <button 
                class="dpad-btn down" 
                class:disabled={selectedEnemy && selectedEnemy.isAlive}
                on:click={() => handleMoveButton('down')}
              >
                ⬇️
              </button>
            </div>
          </div>

          {#if selectedEnemy && selectedEnemy.isAlive}
            {@const currentEnemy = enemies.find(e => e.id === selectedEnemy.id)}
            {#if currentEnemy && currentEnemy.isAlive}
              <div class="enemy-panel">
                <h4>Selected Enemy</h4>
                <div class="enemy-info">
                  <div class="enemy-name">{currentEnemy.sprite} {currentEnemy.name}</div>
                  <div class="enemy-health">
                    ❤️ {currentEnemy.health}/{currentEnemy.maxHealth}
                  </div>
                  {#if isEnemyInRange(currentEnemy)}
                    <button class="attack-btn" on:click={handleAttack}>
                      ⚔️ Attack
                    </button>
                  {:else}
                    <p class="out-of-range">Move closer to attack!</p>
                  {/if}
                </div>
              </div>
            {/if}
          {/if}

          <div class="combat-log">
            <h4>Combat Log</h4>
            <div class="log-entries">
              {#each combatLog as entry}
                <div class="log-entry">{entry.message}</div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .dungeon-game {
    padding: 1em;
  }

  .dungeon-setup {
    max-width: 500px;
    margin: 0 auto;
    padding: 2em;
    background-color: #1a1a1a;
    border-radius: 8px;
    text-align: center;
  }

  .character-info {
    margin: 1.5em 0;
    padding: 1em;
    background-color: #2a2a2a;
    border-radius: 8px;
  }

  .character-info h3 {
    color: #ffd700;
    margin-bottom: 0.5em;
    text-transform: capitalize;
  }

  .stats {
    display: flex;
    justify-content: center;
    gap: 1.5em;
    font-size: 1.1em;
  }

  .difficulty-selector {
    margin: 2em 0;
  }

  .difficulty-selector label {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  .difficulty-selector input {
    width: 100%;
  }

  .difficulty-value {
    font-weight: bold;
    color: #ffd700;
  }

  .start-btn {
    padding: 1em 3em;
    font-size: 1.2em;
    background-color: #4CAF50;
    border-color: #4CAF50;
  }

  .start-btn:hover {
    background-color: #45a049;
  }

  .game-container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1em;
    background-color: #1a1a1a;
    border-radius: 8px;
    margin-bottom: 1em;
  }

  .character-stats h3 {
    margin: 0 0 0.5em 0;
    color: #ffd700;
  }

  .stat-bar {
    font-size: 1.1em;
  }

  .xp-bar {
      position: relative;
      width: 100%;
      min-width: 200px;                    
      height: 32px;                      
      background-color: #333;
      border-radius: 16px;
      overflow: hidden;
      margin-top: 0.5em;
      border: 2px solid #555;
  }

  .xp-progress {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
    transition: width 0.5s ease;
  }

  .xp-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.95em;                   
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      pointer-events: none;
      white-space: nowrap;                 
  }

  .leave-btn {
    background-color: #f44336;
    border-color: #f44336;
  }

  .game-area {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 1em;
  }

  .dungeon-grid-container {
    background-color: #1a1a1a;
    padding: 1em;
    border-radius: 8px;
    overflow: auto;
    max-height: 70vh;
  }

  .dungeon-grid {
    display: grid;
    gap: 2px;
    margin: 0 auto;
    width: fit-content;
  }

  .cell {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border-radius: 2px;
    cursor: pointer;
  }

  .cell[role="button"]:focus {
    outline: 2px solid #ffd700;
    outline-offset: 2px;
  }

  .cell.floor {
    background-color: #2a2a2a;
  }

  .cell.wall {
    background-color: #444;
  }

  .cell.player {
    background-color: #4CAF50;
  }

  .cell.enemy {
    background-color: #f44336;
  }

  .cell.enemy:hover {
    background-color: #ff5544;
  }

  .cell.exit {
    background-color: #4CAF50;
    animation: glow 1.5s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px #4CAF50; }
    50% { box-shadow: 0 0 20px #4CAF50; }
  }

  .cell.selected {
    outline: 3px solid #ffd700;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }

  .controls, .movement-pad, .enemy-panel, .combat-log {
    background-color: #1a1a1a;
    padding: 1em;
    border-radius: 8px;
  }

  h4 {
    margin: 0 0 0.5em 0;
    color: #ffd700;
  }

  .controls p {
    margin: 0.5em 0;
    font-size: 0.9em;
  }

  .movement-pad {
    background-color: #1a1a1a;
    padding: 1em;
    border-radius: 8px;
  }

  .dpad {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .dpad-middle {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .dpad-center {
    width: 60px;
    height: 60px;
    background-color: #2a2a2a;
    border-radius: 8px;
  }

  .dpad-btn {
    width: 60px;
    height: 60px;
    font-size: 24px;
    background-color: #4CAF50;
    border: 2px solid #45a049;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .dpad-btn:hover {
    background-color: #45a049;
    transform: scale(1.05);
  }

  .dpad-btn:active {
    transform: scale(0.95);
    background-color: #3d8b40;
  }

  .dpad-btn.disabled {
    opacity: 0.3;
    cursor: not-allowed;
    background-color: #666;
  }

  .dpad-btn.disabled:hover {
    background-color: #666;
    transform: none;
  }

  .combat-notice {
    color: #ff4444;
    font-weight: bold;
    text-align: center;
    margin: 0.5em 0;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .enemy-info {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  .enemy-name {
    font-size: 1.1em;
    font-weight: bold;
  }

  .attack-btn {
    background-color: #f44336;
    border-color: #f44336;
    margin-top: 0.5em;
  }

  .out-of-range {
    color: #ff9800;
    font-style: italic;
  }

  .combat-log {
    flex: 1;
    max-height: 300px;
    overflow-y: auto;
  }

  .log-entries {
    display: flex;
    flex-direction: column;
    gap: 0.25em;
  }

  .log-entry {
    font-size: 0.9em;
    padding: 0.25em;
    background-color: #2a2a2a;
    border-radius: 4px;
  }
</style>