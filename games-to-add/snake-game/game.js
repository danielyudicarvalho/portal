// Initialize socket connection
const socket = io();

class OnlineSnakeGame extends Phaser.Scene {
    constructor() {
        super({ key: 'OnlineSnakeGame' });
        this.players = new Map();
        this.myPlayerId = null;
        this.staticFood = {};
        this.tempFood = {};
        this.movingFood = {};
        this.weaponFood = {};
        this.armorFood = {};
        this.poisonFood = {};
        this.projectiles = [];
        this.gridSize = 20;
        this.fieldWidth = 80;  // 80 grid cells wide
        this.fieldHeight = 50; // 50 grid cells tall
        this.gameOver = false;
        this.connected = false;
        this.timeRemaining = 0;
        this.sessionEnded = false;
        this.canRespawn = false;
    }

    preload() {
        // No assets needed - we'll use Phaser's built-in graphics
    }

    create() {
        // Setup input handling
        this.setupInputs();

        // Setup socket event listeners
        this.setupSocketListeners();

        // Create UI elements
        this.createUI();

        // Show connection status
        this.updateConnectionStatus('Connecting...');
    }

    setupInputs() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');

        // Handle input
        this.input.keyboard.on('keydown', (event) => {
            if (!this.connected || this.gameOver) return;

            let direction = null;

            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    direction = 'UP';
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    direction = 'DOWN';
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    direction = 'LEFT';
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    direction = 'RIGHT';
                    break;
            }

            if (direction) {
                socket.emit('move', direction);
            }
        });

        // Handle shooting with SPACE key
        this.input.keyboard.on('keydown', (event) => {
            if (!this.connected || this.gameOver) return;

            const myPlayer = this.players.get(this.myPlayerId);
            if (!myPlayer || !myPlayer.alive || myPlayer.shots <= 0 || myPlayer.score < 5) return;

            if (event.code === 'KeyX') { // Use X key for shooting
                socket.emit('shoot');
            } else if (event.code === 'KeyZ') { // Use Z key for armor
                socket.emit('activateArmor');
            }
        });
    }

    setupSocketListeners() {
        // Connection established
        socket.on('connect', () => {
            this.connected = true;
            this.updateConnectionStatus('Connected');
        });

        // Connection lost
        socket.on('disconnect', () => {
            this.connected = false;
            this.updateConnectionStatus('Disconnected');
        });

        // Game is full
        socket.on('gameFull', () => {
            this.updateConnectionStatus('Game is full (8/8 players)');
        });

        // Initial game state
        socket.on('gameState', (data) => {
            this.myPlayerId = data.playerId;
            this.updatePlayers(data.players);
            this.updateFood(data);
            this.updatePlayerCount(data.players.length);
            this.timeRemaining = data.timeRemaining;
            this.sessionEnded = data.gameEnded;
        });

        // Player joined
        socket.on('playerJoined', (player) => {
            this.players.set(player.id, player);
            this.updatePlayerCount(this.players.size);
        });

        // Player left
        socket.on('playerLeft', (playerId) => {
            if (this.players.has(playerId)) {
                this.players.get(playerId).sprites?.clear(true, true);
                this.players.delete(playerId);
                this.updatePlayerCount(this.players.size);
            }
        });

        // Game update
        socket.on('gameUpdate', (data) => {
            this.updatePlayers(data.players);
            this.movingFood = data.movingFood;
            this.poisonFood = data.poisonFood || {};
            this.projectiles = data.projectiles || [];
            this.timeRemaining = data.timeRemaining;
            this.drawAllElements();
            this.updateMyScore();
            this.updateTimer();
        });

        // Food spawned
        socket.on('foodSpawned', (data) => {
            this[data.type] = data.position;
        });

        // Player died
        socket.on('playerDied', (playerId) => {
            const player = this.players.get(playerId);
            if (player) {
                player.alive = false;
                this.showDeathEffect(player);

                // Show respawn option if it's the current player
                if (playerId === this.myPlayerId && !this.sessionEnded) {
                    this.canRespawn = true;
                    this.showRespawnButton();
                }
            }
        });

        // Player respawned
        socket.on('playerRespawned', (player) => {
            this.players.set(player.id, player);

            if (player.id === this.myPlayerId) {
                this.canRespawn = false;
                this.hideRespawnButton();
                this.showNotification('You respawned! Keep playing!');
            } else {
                this.showNotification(`${player.name} respawned!`);
            }
        });

        // New session started
        socket.on('newSessionStarted', (data) => {
            this.sessionEnded = false;
            this.canRespawn = false;
            this.hideRespawnButton();
            this.timeRemaining = data.sessionDuration;
            this.showNotification('New 5-minute session started!');
        });

        // Session ended
        socket.on('sessionEnded', (data) => {
            this.sessionEnded = true;
            this.canRespawn = false;
            this.hideRespawnButton();
            this.showSessionEndScreen(data);
        });

        // Player got weapon
        socket.on('playerGotWeapon', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.shots = data.shots;
                if (data.playerId === this.myPlayerId) {
                    this.showNotification(`You got a weapon! 1 shot available! (Press X to shoot ahead)`);
                }
            }
        });

        // Player got armor
        socket.on('playerGotArmor', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.armor = data.armor;
                if (data.playerId === this.myPlayerId) {
                    this.showNotification(`You got armor! 1 armor available! (Press Z to activate - costs 5 points)`);
                }
            }
        });

        // Armor activated
        socket.on('armorActivated', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.armor = data.playerArmor;
                player.score = data.playerScore;
                player.armored = true;
                if (data.playerId === this.myPlayerId) {
                    this.showNotification(`Armor activated! You're protected for 10 seconds!`);
                }
            }
        });

        // Armor expired
        socket.on('armorExpired', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.armored = false;
                if (data.playerId === this.myPlayerId) {
                    this.showNotification(`Your armor expired!`);
                }
            }
        });

        // Armor used (blocked damage)
        socket.on('armorUsed', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.armored = false;
                if (data.playerId === this.myPlayerId) {
                    this.showNotification(`Your armor blocked damage!`);
                }
            }
        });

        // Player poisoned
        socket.on('playerPoisoned', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.alive = false;
                player.armored = false;
                this.showDeathEffect(player);
                
                if (data.playerId === this.myPlayerId) {
                    this.showNotification(`You ate poison food and died! ☠️`);
                    this.canRespawn = true;
                    this.showRespawnButton();
                } else {
                    this.showNotification(`${data.playerName} ate poison food and died! ☠️`);
                }
            }
        });

        // Poison food expired
        socket.on('poisonFoodExpired', () => {
            this.poisonFood = { x: undefined, y: undefined };
            this.showNotification(`Poison food disappeared! ⚡`);
        });

        // Projectile fired
        socket.on('projectileFired', (data) => {
            const player = this.players.get(data.projectile.playerId);
            if (player) {
                player.shots = data.playerShots;
                player.score = data.playerScore;
            }
        });

        // Player shot
        socket.on('playerShot', (data) => {
            const victim = this.players.get(data.victimId);
            const shooter = this.players.get(data.shooterId);

            if (victim) {
                victim.alive = false;
                this.showDeathEffect(victim);
            }

            if (shooter) {
                shooter.score = data.shooterScore;
            }

            if (data.victimId === this.myPlayerId) {
                this.showNotification(`You were shot by ${data.shooterName}!`);
                this.canRespawn = true;
                this.showRespawnButton();
            } else if (data.shooterId === this.myPlayerId) {
                this.showNotification(`You shot ${victim.name}! +20 points!`);
            } else {
                this.showNotification(`${data.shooterName} shot ${victim.name}!`);
            }
        });

        // Player killed another player
        socket.on('playerKilled', (data) => {
            const killer = this.players.get(data.killerId);
            const victim = this.players.get(data.victimId);

            if (victim) {
                victim.alive = false;
                this.showDeathEffect(victim);
            }

            if (killer) {
                killer.score = data.killerScore;
                this.showKillEffect(killer, victim);
            }
        });

        // Game over
        socket.on('gameOver', (winner) => {
            this.gameOver = true;
            this.showGameOver(winner);
        });

        // Game reset
        socket.on('gameReset', () => {
            this.gameOver = false;
            this.clearGameOverText();
        });
    }

    updatePlayers(playersArray) {
        // Clear existing players
        this.players.clear();

        // Add updated players
        playersArray.forEach(playerData => {
            this.players.set(playerData.id, playerData);
        });
    }

    updateFood(data) {
        this.staticFood = data.staticFood;
        this.tempFood = data.tempFood;
        this.movingFood = data.movingFood;
        this.weaponFood = data.weaponFood;
        this.armorFood = data.armorFood;
        this.poisonFood = data.poisonFood || {};
        this.projectiles = data.projectiles || [];
    }

    drawAllElements() {
        // Clear all existing sprites
        this.children.removeAll();
        this.createUI();

        // Draw all players
        this.players.forEach(player => {
            if (player.alive) {
                this.drawPlayerSnake(player);
            }
        });

        // Draw food
        this.drawFood();

        // Draw projectiles
        this.drawProjectiles();
    }

    drawPlayerSnake(player) {
        player.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize + this.gridSize / 2;
            const y = segment.y * this.gridSize + this.gridSize / 2;

            const rect = this.add.rectangle(x, y, this.gridSize - 2, this.gridSize - 2);

            // Head is darker color, body is lighter color
            if (index === 0) {
                rect.setFillStyle(player.color.head);

                // Add armor glow effect if player is armored
                if (player.armored) {
                    const armorGlow = this.add.circle(x, y, this.gridSize / 2 + 3, 0xffffff);
                    armorGlow.setAlpha(0.3);
                }

                // Add player name above head
                const nameColor = player.armored ? '#00ff00' : '#ffffff';
                this.add.text(x, y - 25, player.name, {
                    fontSize: '12px',
                    fill: nameColor,
                    fontFamily: 'Arial',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);
            } else {
                rect.setFillStyle(player.color.body);

                // Add subtle armor glow to body segments if armored
                if (player.armored) {
                    const bodyGlow = this.add.circle(x, y, this.gridSize / 2 + 1, 0xffffff);
                    bodyGlow.setAlpha(0.1);
                }
            }
        });
    }

    drawFood() {
        // Static food (red)
        if (this.staticFood.x !== undefined) {
            const x = this.staticFood.x * this.gridSize + this.gridSize / 2;
            const y = this.staticFood.y * this.gridSize + this.gridSize / 2;
            const rect = this.add.rectangle(x, y, this.gridSize - 2, this.gridSize - 2);
            rect.setFillStyle(0xe74c3c);
        }

        // Temporary food (orange)
        if (this.tempFood.x !== undefined) {
            const x = this.tempFood.x * this.gridSize + this.gridSize / 2;
            const y = this.tempFood.y * this.gridSize + this.gridSize / 2;
            const rect = this.add.rectangle(x, y, this.gridSize - 2, this.gridSize - 2);
            rect.setFillStyle(0xf39c12);
        }

        // Moving food (blue)
        if (this.movingFood.x !== undefined) {
            const x = this.movingFood.x * this.gridSize + this.gridSize / 2;
            const y = this.movingFood.y * this.gridSize + this.gridSize / 2;
            const rect = this.add.rectangle(x, y, this.gridSize - 2, this.gridSize - 2);
            rect.setFillStyle(0x3498db);
        }

        // Weapon food (purple with glow effect)
        if (this.weaponFood.x !== undefined) {
            const x = this.weaponFood.x * this.gridSize + this.gridSize / 2;
            const y = this.weaponFood.y * this.gridSize + this.gridSize / 2;
            const rect = this.add.rectangle(x, y, this.gridSize - 2, this.gridSize - 2);
            rect.setFillStyle(0x8e44ad);

            // Add weapon symbol
            this.add.text(x, y, '⚡', {
                fontSize: '16px',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }

        // Armor food (silver/gray with shield symbol)
        if (this.armorFood.x !== undefined) {
            const x = this.armorFood.x * this.gridSize + this.gridSize / 2;
            const y = this.armorFood.y * this.gridSize + this.gridSize / 2;
            const rect = this.add.rectangle(x, y, this.gridSize - 2, this.gridSize - 2);
            rect.setFillStyle(0x95a5a6);

            // Add armor symbol
            this.add.text(x, y, '🛡️', {
                fontSize: '16px',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }

        // Poison food (dark red/black with skull symbol) - only if it exists
        if (this.poisonFood.x !== undefined && this.poisonFood.y !== undefined) {
            const x = this.poisonFood.x * this.gridSize + this.gridSize / 2;
            const y = this.poisonFood.y * this.gridSize + this.gridSize / 2;
            const rect = this.add.rectangle(x, y, this.gridSize - 2, this.gridSize - 2);
            rect.setFillStyle(0x8b0000); // Dark red

            // Add pulsing effect to make it more noticeable and dangerous
            this.tweens.add({
                targets: rect,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 300,
                yoyo: true,
                repeat: -1
            });

            // Add poison symbol
            const poisonText = this.add.text(x, y, '☠️', {
                fontSize: '16px',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            // Make the poison symbol pulse too
            this.tweens.add({
                targets: poisonText,
                alpha: 0.5,
                duration: 400,
                yoyo: true,
                repeat: -1
            });
        }
    }

    drawProjectiles() {
        this.projectiles.forEach(projectile => {
            const x = projectile.x * this.gridSize + this.gridSize / 2;
            const y = projectile.y * this.gridSize + this.gridSize / 2;

            // Draw projectile as a small yellow circle
            const circle = this.add.circle(x, y, 4, 0xf1c40f);

            // Add trail effect based on direction
            let trailX = x, trailY = y;
            switch (projectile.direction) {
                case 'LEFT': trailX += 8; break;
                case 'RIGHT': trailX -= 8; break;
                case 'UP': trailY += 8; break;
                case 'DOWN': trailY -= 8; break;
            }

            this.add.circle(trailX, trailY, 2, 0xf39c12);
        });
    }

    showDeathEffect(player) {
        if (player.snake.length > 0) {
            const head = player.snake[0];
            const x = head.x * this.gridSize + this.gridSize / 2;
            const y = head.y * this.gridSize + this.gridSize / 2;

            this.add.text(x, y, '💀', {
                fontSize: '20px',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }
    }

    showKillEffect(killer, victim) {
        if (killer.snake.length > 0) {
            const head = killer.snake[0];
            const x = head.x * this.gridSize + this.gridSize / 2;
            const y = head.y * this.gridSize + this.gridSize / 2;

            // Show kill effect above killer's head
            const killText = this.add.text(x, y - 30, '🔥 KILL! 🔥', {
                fontSize: '14px',
                fill: '#f1c40f',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            // Fade out the kill text after 2 seconds
            this.tweens.add({
                targets: killText,
                alpha: 0,
                duration: 2000,
                onComplete: () => killText.destroy()
            });
        }

        // Show notification if it's the current player
        if (killer.id === this.myPlayerId) {
            this.showNotification(`You killed ${victim.name}! +${Math.floor(victim.snake.length * 2)} points!`);
        } else if (victim.id === this.myPlayerId) {
            this.showNotification(`You were killed by ${killer.name}!`);
        }
    }

    showNotification(message) {
        const notification = this.add.text(900, 100, message, {
            fontSize: '18px',
            fill: '#e74c3c',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Fade out notification after 3 seconds
        this.tweens.add({
            targets: notification,
            alpha: 0,
            duration: 3000,
            onComplete: () => notification.destroy()
        });
    }

    showGameOver(winner) {
        let message = 'Game Over!';
        if (winner) {
            message = `${winner.name} Wins!`;
            if (winner.id === this.myPlayerId) {
                message = 'You Win! 🎉';
            }
        } else {
            message = 'Draw - All players died!';
        }

        this.gameOverText = this.add.text(900, 450, message, {
            fontSize: '36px',
            fill: '#e74c3c',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.restartText = this.add.text(900, 520, 'New game starting in 5 seconds...', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }

    clearGameOverText() {
        if (this.gameOverText) {
            this.gameOverText.destroy();
            this.gameOverText = null;
        }
        if (this.restartText) {
            this.restartText.destroy();
            this.restartText = null;
        }
    }

    createUI() {
        // Create leaderboard
        this.createLeaderboard();
    }

    createLeaderboard() {
        const players = Array.from(this.players.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);

        // Position leaderboard on the right side of the larger field
        const startX = 1620; // Right side of the 1600px canvas

        players.forEach((player, index) => {
            const y = 80 + index * 20;
            const isMe = player.id === this.myPlayerId;
            const prefix = isMe ? '► ' : '  ';
            const color = isMe ? '#f1c40f' : '#ecf0f1';

            const length = player.snake ? player.snake.length : 3;
            const shots = player.shots || 0;
            const armor = player.armor || 0;
            const armorStatus = player.armored ? ' [ARMORED]' : '';
            let status = '';
            if (!player.alive) {
                status = this.sessionEnded ? ' (DEAD)' : ' (DEAD - Can Respawn)';
            }

            this.add.text(startX, y, `${prefix}${player.name}: ${player.score} (L:${length} S:${shots} A:${armor})${armorStatus}${status}`, {
                fontSize: '14px',
                fill: color,
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 1
            });
        });
    }

    updateMyScore() {
        const myPlayer = this.players.get(this.myPlayerId);
        if (myPlayer) {
            document.getElementById('score').textContent = `Your Score: ${myPlayer.score}`;
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.style.color = this.connected ? '#2ecc71' : '#e74c3c';
        }
    }

    updatePlayerCount(count) {
        const countElement = document.getElementById('player-count');
        if (countElement) {
            countElement.textContent = `Players: ${count}/8`;
        }
    }

    updateTimer() {
        const minutes = Math.floor(this.timeRemaining / 60000);
        const seconds = Math.floor((this.timeRemaining % 60000) / 1000);
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Create or update timer display in game
        if (this.timerText) {
            this.timerText.destroy();
        }

        this.timerText = this.add.text(800, 30, `Session Time: ${timeText}`, {
            fontSize: '20px',
            fill: this.timeRemaining < 30000 ? '#e74c3c' : '#ecf0f1', // Red when less than 30 seconds
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }

    showRespawnButton() {
        if (this.respawnButton) return; // Already showing

        this.respawnButton = this.add.text(900, 500, 'Press R to Respawn', {
            fontSize: '24px',
            fill: '#2ecc71',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // Add pulsing effect
        this.tweens.add({
            targets: this.respawnButton,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Handle R key for respawn
        this.respawnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.respawnKey.on('down', () => {
            if (this.canRespawn && !this.sessionEnded) {
                socket.emit('respawn');
            }
        });
    }

    hideRespawnButton() {
        if (this.respawnButton) {
            this.respawnButton.destroy();
            this.respawnButton = null;
        }
        if (this.respawnKey) {
            this.respawnKey.removeAllListeners();
            this.respawnKey = null;
        }
    }

    showSessionEndScreen(data) {
        // Clear existing UI
        this.children.removeAll();

        // Show session results
        const title = this.add.text(900, 300, '5-Minute Session Ended!', {
            fontSize: '32px',
            fill: '#f1c40f',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        const winnerText = this.add.text(900, 360, `Winner: ${data.winner.name} (${data.winner.score} points)`, {
            fontSize: '24px',
            fill: data.winner.id === this.myPlayerId ? '#2ecc71' : '#ecf0f1',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Show final scores
        let yPos = 420;
        this.add.text(900, yPos, 'Final Scores:', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        data.finalScores.slice(0, 5).forEach((player, index) => {
            yPos += 30;
            const isMe = player.id === this.myPlayerId;
            this.add.text(900, yPos, `${index + 1}. ${player.name}: ${player.score}`, {
                fontSize: '16px',
                fill: isMe ? '#f1c40f' : '#ecf0f1',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5);
        });

        // Countdown to next session
        this.add.text(900, yPos + 60, 'New session starting in 10 seconds...', {
            fontSize: '18px',
            fill: '#95a5a6',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }
}

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: 1800,
    height: 1000,
    parent: 'game',
    backgroundColor: '#34495e',
    scene: OnlineSnakeGame,
    physics: {
        default: 'arcade'
    }
};

// Start the game
const game = new Phaser.Game(config);