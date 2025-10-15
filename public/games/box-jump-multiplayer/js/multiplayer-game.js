// Socket connection
const socket = io('http://localhost:3003');

// Game variables
let game;
let currentPlayerId = null;
let isMyTurn = false;
let gameStarted = false;

// Map data (same as original)
const map = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 5, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 5, 5, 5, 0, 0, 0, 0, 2, 3, 0, 0, 0, 0, 0, 2, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 2, 0, 0, 0, 5, 0, 0, 0, 0, 2, 0, 0, 0, 5, 0, 0, 0, 3],
  [0, 0, 0, 0, 2, 3, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 2, 2, 0, 0],
  [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 2, 3, 0, 0, 0],
  [0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2],
  [0, 0, 5, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 2],
  [0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 5, 0, 0, 0, 2, 2, 2, 0, 0, 5],
  [0, 0, 0, 0, 2, 3, 2, 0, 0, 0, 5, 5, 0, 0, 0, 2, 3, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 0, 2],
  [0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0],
  [0, 0, 0, 0, 4, 0, 0, 0, 0, 5, 0, 0, 0, 3, 3, 0, 0, 0, 0, 5, 0, 0],
  [0, 0, 0, 0, 0, 5, 0, 0, 2, 2, 0, 0, 0, 0, 5, 5, 0, 0, 0, 4, 0, 0],
  [0, 0, 0, 0, 1, 4, 1, 0, 0, 0, 0, 1, 4, 1, 0, 0, 0, 0, 0, 1, 4, 1],
  [0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 2, 0, 0]
];

// DOM elements
const lobby = document.getElementById('lobby');
const gameArea = document.getElementById('gameArea');
const playerNameInput = document.getElementById('playerName');
const joinBtn = document.getElementById('joinBtn');
const startGameBtn = document.getElementById('startGameBtn');
const playersSection = document.getElementById('playersSection');
const playersList = document.getElementById('playersList');
const playerCount = document.getElementById('playerCount');
const currentTurn = document.getElementById('currentTurn');
const spectatorMode = document.getElementById('spectatorMode');
const errorMessage = document.getElementById('errorMessage');

// Event listeners
joinBtn.addEventListener('click', joinGame);
startGameBtn.addEventListener('click', startGame);
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinGame();
});

// Socket event handlers
socket.on('playerJoined', (data) => {
    currentPlayerId = data.playerId;
    playersSection.classList.remove('hidden');
    joinBtn.style.display = 'none';
    playerNameInput.style.display = 'none';
});

socket.on('playersUpdate', (players) => {
    updatePlayersList(players);
});

socket.on('canStartGame', (canStart) => {
    startGameBtn.disabled = !canStart;
});

socket.on('newLevel', (data) => {
    document.getElementById('currentLevel').textContent = data.level + 1;
    document.getElementById('totalLevels').textContent = data.totalLevels;
    
    if (game) {
        game.state.start('Play', true, false, data.level);
    } else {
        initializeGame(data.level);
    }
    
    showGameArea();
});

socket.on('playerTurn', (data) => {
    isMyTurn = data.playerId === currentPlayerId;
    
    document.getElementById('turnPlayerName').textContent = data.playerName;
    document.getElementById('turnLevel').textContent = data.level + 1;
    
    currentTurn.classList.remove('hidden');
    
    if (isMyTurn) {
        spectatorMode.classList.add('hidden');
        // Enable game controls
        if (game && game.state.current === 'Play') {
            game.state.getCurrentState().enableControls();
        }
    } else {
        spectatorMode.classList.remove('hidden');
        // Disable game controls
        if (game && game.state.current === 'Play') {
            game.state.getCurrentState().disableControls();
        }
    }
});

socket.on('playerAttemptResult', (data) => {
    showAttemptResult(data);
});

socket.on('gameCompleted', (data) => {
    showFinalResults(data);
});

socket.on('gameReset', () => {
    resetToLobby();
});

socket.on('gameError', (message) => {
    showError(message);
});

socket.on('gameEnded', (message) => {
    showError(message);
    setTimeout(() => resetToLobby(), 3000);
});

// Functions
function joinGame() {
    const name = playerNameInput.value.trim();
    if (name.length < 2) {
        showError('Name must be at least 2 characters');
        return;
    }
    socket.emit('joinGame', name);
}

function startGame() {
    socket.emit('startGame');
}

function updatePlayersList(players) {
    playersList.innerHTML = '';
    playerCount.textContent = players.length;
    
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML = `
            <span>${player.name}</span>
            <span>Level: ${player.currentLevel} | Deaths: ${player.deaths}</span>
        `;
        playersList.appendChild(playerDiv);
    });
    
    document.getElementById('gamePlayerCount').textContent = players.length;
}

function showGameArea() {
    lobby.style.display = 'none';
    gameArea.style.display = 'block';
    gameStarted = true;
}

function showAttemptResult(data) {
    const resultsDiv = document.getElementById('gameResults');
    const resultsContent = document.getElementById('resultsContent');
    
    resultsContent.innerHTML = `
        <p><strong>${data.playerName}</strong> ${data.success ? 'passed' : 'failed'} the level</p>
        <p>Deaths this attempt: ${data.deaths}</p>
        <p>Total deaths: ${data.totalDeaths}</p>
    `;
    
    resultsDiv.classList.remove('hidden');
    
    setTimeout(() => {
        resultsDiv.classList.add('hidden');
    }, 3000);
}

function showFinalResults(data) {
    const finalResults = document.getElementById('finalResults');
    const finalResultsContent = document.getElementById('finalResultsContent');
    
    let resultsHTML = `<h3>🏆 Winner: ${data.winner.name}</h3><br>`;
    resultsHTML += '<h4>Final Rankings:</h4>';
    
    data.results.forEach((player, index) => {
        resultsHTML += `
            <p>${index + 1}. ${player.name} - Level ${player.currentLevel} (${player.deaths} deaths)</p>
        `;
    });
    
    finalResultsContent.innerHTML = resultsHTML;
    finalResults.classList.remove('hidden');
}

function resetToLobby() {
    lobby.style.display = 'block';
    gameArea.style.display = 'none';
    document.getElementById('finalResults').classList.add('hidden');
    
    joinBtn.style.display = 'inline-block';
    playerNameInput.style.display = 'inline-block';
    playersSection.classList.add('hidden');
    
    gameStarted = false;
    isMyTurn = false;
    
    if (game) {
        game.destroy();
        game = null;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

function initializeGame(level) {
    const w = 600;
    const h = 200;
    
    game = new Phaser.Game(w, h, Phaser.AUTO, 'gameCanvas');
    
    // Game states
    const GameStates = {};
    
    // Load state to handle asset loading
    GameStates.Load = function(game) {};
    GameStates.Load.prototype = {
        preload: function() {
            game.stage.backgroundColor = '#9b59b6';
            
            // Create loading text
            const loadingText = game.add.text(w/2, h/2, 'Loading...', {
                font: '20px Arial',
                fill: '#fff'
            });
            loadingText.anchor.setTo(0.5, 0.5);
            
            // Create simple colored rectangles as bitmap data
            this.createAssets();
        },
        
        create: function() {
            game.state.start('Play', true, false, level);
        },
        
        createAssets: function() {
            // Player sprite (green rectangle)
            const playerBmd = game.add.bitmapData(20, 20);
            playerBmd.ctx.fillStyle = '#2ecc71';
            playerBmd.ctx.fillRect(0, 0, 20, 20);
            game.cache.addBitmapData('player', playerBmd);
            
            // Cube sprite (red rectangle)
            const cubeBmd = game.add.bitmapData(20, 20);
            cubeBmd.ctx.fillStyle = '#e74c3c';
            cubeBmd.ctx.fillRect(0, 0, 20, 20);
            game.cache.addBitmapData('cube', cubeBmd);
            
            // Line sprite (white rectangle)
            const lineBmd = game.add.bitmapData(600, 5);
            lineBmd.ctx.fillStyle = '#ffffff';
            lineBmd.ctx.fillRect(0, 0, 600, 5);
            game.cache.addBitmapData('line', lineBmd);
            
            // Pixel for particles
            const pixelBmd = game.add.bitmapData(4, 4);
            pixelBmd.ctx.fillStyle = '#ffffff';
            pixelBmd.ctx.fillRect(0, 0, 4, 4);
            game.cache.addBitmapData('pixel', pixelBmd);
        }
    };
    
    // Play state
    GameStates.Play = function(game) {};
    GameStates.Play.prototype = {
        init: function(levelIndex) {
            this.currentLevel = levelIndex || 0;
            this.deaths = 0;
            this.levelCompleted = false;
            this.controlsEnabled = isMyTurn; // Enable controls if it's my turn
        },
        

        
        create: function() {
            game.stage.backgroundColor = '#9b59b6';
            
            // Player
            this.player = game.add.sprite(80, h * 2 / 3 - 30, game.cache.getBitmapData('player'));
            game.physics.arcade.enable(this.player);
            this.player.body.bounce.y = 0;
            this.player.body.gravity.y = 800;
            this.player.body.setSize(20, 20, 0, 0);
            this.player.anchor.setTo(0.5, 0.5);
            this.player.alive = true; // Add alive flag like original
            
            // Ground line
            this.line = game.add.sprite(w / 2, Math.floor(h * 2 / 3), game.cache.getBitmapData('line'));
            this.line.anchor.setTo(0.5, 0.5);
            game.physics.arcade.enable(this.line);
            this.line.body.immovable = true;
            this.line.body.setSize(600, 5, 0, 0);
            
            // Cubes group
            this.cubes = game.add.group();
            
            // Input
            this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            
            // Particle emitter
            this.emitter = game.add.emitter(0, 0, 200);
            this.emitter.makeParticles(game.cache.getBitmapData('pixel'));
            this.emitter.gravity = 0;
            this.emitter.minParticleSpeed.setTo(-200, -200);
            this.emitter.maxParticleSpeed.setTo(200, 200);
            
            // Load level
            this.loadLevel(map[this.currentLevel]);
            
            // UI
            this.createUI();
            
            // Enable controls if it's the player's turn
            if (isMyTurn) {
                this.controlsEnabled = true;
            }
        },
        
        update: function() {
            // Always handle physics, even when spectating
            game.physics.arcade.collide(this.player, this.line);
            
            // Only check collisions and movement if player is alive and not already dying
            if (this.player.alive && !this.isDying && !this.levelCompleted) {
                // Check collision with cubes (death) - this should happen before other logic
                game.physics.arcade.overlap(this.player, this.cubes, this.playerHit, null, this);
                
                // Manual collision check as backup - more precise
                this.cubes.forEachAlive(function(cube) {
                    if (cube.alive && this.player.alive && !this.isDying) {
                        // Check if player's body overlaps with cube's body
                        if (this.player.body.x < cube.body.x + cube.body.width &&
                            this.player.body.x + this.player.body.width > cube.body.x &&
                            this.player.body.y < cube.body.y + cube.body.height &&
                            this.player.body.y + this.player.body.height > cube.body.y) {
                            console.log('Manual collision detected! Player hit cube at:', cube.x, cube.y);
                            this.playerHit(this.player, cube);
                        }
                    }
                }, this);
            }
            
            if (!this.controlsEnabled) {
                // When spectating, keep player on ground but don't move
                if (this.player.body.touching.down) {
                    this.player.body.velocity.x = 0;
                }
                return;
            }
            
            // Only allow movement if player is alive and not dying
            if (this.player.alive && !this.isDying && !this.levelCompleted) {
                // Jump
                if (this.spaceKey.isDown && this.player.body.touching.down) {
                    this.playerJump();
                }
                
                // Auto-move when on ground (like original)
                if (this.player.body.touching.down) {
                    this.player.body.velocity.x = 170;
                }
                
                // Check level completion
                if (this.player.x >= w - 60) {
                    this.completeLevel(true);
                }
            }
            
            // Check death (fell below ground) - only if not already dying
            if (this.player.y > this.line.y + 50 && !this.isDying) {
                this.playerDeath();
            }
            
            // Update particle effects
            this.emitter.forEachAlive(function(particle) {
                particle.alpha = game.math.clamp(particle.lifespan / 100, 0, 1);
            }, this);
        },
        
        render: function() {
            // Debug: Draw collision boxes
            if (this.player && this.player.body) {
                game.debug.body(this.player);
            }
            
            this.cubes.forEachAlive(function(cube) {
                if (cube.body) {
                    game.debug.body(cube);
                }
            });
        },
        
        playerJump: function() {
            this.player.body.velocity.y = -350;
            
            // Rotation animation
            this.rotation = game.add.tween(this.player).to({
                angle: this.player.angle + 180
            }, 700, Phaser.Easing.Linear.None);
            this.rotation.start();
        },
        
        playerHit: function(player, hit) {
            console.log('COLLISION DETECTED! Player hit cube! Player alive:', this.player.alive, 'isDying:', this.isDying);
            if (this.player.alive && !this.isDying) {
                console.log('Player was alive, calling death immediately');
                this.player.alive = false;
                
                // Immediate visual feedback
                this.player.tint = 0xff0000; // Red tint immediately
                
                this.playerDeath();
            }
        },
        
        playerDeath: function() {
            console.log('playerDeath called. levelCompleted:', this.levelCompleted, 'isDying:', this.isDying);
            if (this.levelCompleted || this.isDying) return;
            
            this.isDying = true;
            this.player.alive = false;
            console.log('Player is dying! Deaths:', this.deaths + 1);
            
            // Stop player immediately and disable physics
            this.player.body.velocity.x = 0;
            this.player.body.velocity.y = 0;
            this.player.body.gravity.y = 0;
            this.player.body.enable = false; // Disable physics body to prevent further collisions
            
            // Particle effect
            this.emitter.x = this.player.x + this.player.width / 2;
            this.emitter.y = this.player.y + this.player.height / 2;
            this.emitter.start(true, 300, null, 8);
            
            // Flash effect
            this.player.tint = 0xff0000; // Red tint
            
            this.deaths++;
            this.updateDeathLabel();
            
            // End turn after death - send failure result to server
            game.time.events.add(1000, function() {
                console.log('Ending turn due to death');
                this.completeLevel(false); // false = failed the level
            }, this);
        },
        
        resetPlayer: function() {
            console.log('Resetting player for new turn');
            // Reset like original game
            this.player.body.enable = true; // Re-enable physics body
            this.player.body.gravity.y = 800; // Restore gravity immediately
            this.player.x = 80;
            this.player.y = h * 2 / 3 - this.player.height / 2 - 30;
            this.player.body.velocity.x = 0;
            this.player.body.velocity.y = 0;
            this.player.angle = 0;
            this.player.tint = 0xffffff; // Reset tint to normal
            this.player.alive = true; // Reset alive state
            this.isDying = false; // Reset dying state
            this.levelCompleted = false; // Reset level completion state
            
            if (this.rotation) {
                this.rotation.pause();
            }
        },
        
        completeLevel: function(success) {
            this.levelCompleted = true;
            this.controlsEnabled = false;
            
            // Send result to server
            socket.emit('playerFinishedLevel', {
                success: success,
                deaths: this.deaths
            });
        },
        
        loadLevel: function(levelMap) {
            // Clear all existing cubes
            this.cubes.removeAll(true);
            
            console.log('Loading level with map:', levelMap);
            
            // Create cubes directly (simpler approach for testing)
            for (let i = 0; i < levelMap.length; i++) {
                if (levelMap[i] !== 0) {
                    let height = 1;
                    let yPos = h * 2 / 3;
                    
                    switch(levelMap[i]) {
                        case 1: height = 0.3; break;
                        case 2: height = 1; break;
                        case 3: height = 1.5; break;
                        case 4: height = 1.8; break;
                        case 5: height = 0.5; yPos = h * 2 / 3 - 22; break;
                    }
                    
                    // Create cube directly
                    const cube = game.add.sprite(100 + i * 20, yPos, game.cache.getBitmapData('cube'));
                    game.physics.arcade.enable(cube);
                    cube.body.immovable = true;
                    cube.anchor.setTo(0, 1);
                    cube.scale.y = height;
                    
                    // Set collision body to match the scaled sprite
                    const bodyHeight = 20 * height;
                    cube.body.setSize(20, bodyHeight, 0, -bodyHeight + 20);
                    
                    this.cubes.add(cube);
                    
                    console.log('Created cube', i, 'at:', cube.x, cube.y, 'height:', height, 'body size:', cube.body.width, 'x', cube.body.height);
                }
            }
            
            console.log('Total cubes created:', this.cubes.length);
        },
        
        createUI: function() {
            this.deathLabel = game.add.text(100, h - 35, 'Deaths: 0', {
                font: '18px Arial',
                fill: '#fff'
            });
            this.deathLabel.anchor.setTo(0.5, 0.5);
            
            this.levelLabel = game.add.text(w - 100, h - 35, `Level: ${this.currentLevel + 1}`, {
                font: '18px Arial',
                fill: '#fff'
            });
            this.levelLabel.anchor.setTo(0.5, 0.5);
            
            if (!isMyTurn) {
                this.spectatorLabel = game.add.text(w / 2, 30, 'SPECTATING', {
                    font: '24px Arial',
                    fill: '#f39c12'
                });
                this.spectatorLabel.anchor.setTo(0.5, 0.5);
            }
        },
        
        updateDeathLabel: function() {
            this.deathLabel.setText(`Deaths: ${this.deaths}`);
        },
        
        enableControls: function() {
            console.log('Enabling controls for new turn');
            this.controlsEnabled = true;
            this.resetPlayer(); // Reset player position when turn starts
            if (this.spectatorLabel) {
                this.spectatorLabel.destroy();
                this.spectatorLabel = null;
            }
        },
        
        disableControls: function() {
            this.controlsEnabled = false;
            if (!this.spectatorLabel) {
                this.spectatorLabel = game.add.text(w / 2, 30, 'SPECTATING', {
                    font: '24px Arial',
                    fill: '#f39c12'
                });
                this.spectatorLabel.anchor.setTo(0.5, 0.5);
            }
        }
    };
    
    game.state.add('Load', GameStates.Load);
    game.state.add('Play', GameStates.Play);
    game.state.start('Load');
}