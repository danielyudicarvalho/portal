class TankBattleGame extends Phaser.Scene {
    constructor() {
        super({ key: 'TankBattleGame' });
        this.socket = null;
        this.players = {};
        this.bullets = {};
        this.cursors = null;
        this.spaceKey = null;
        this.playerTank = null;
        this.lastShot = 0;
        this.shootCooldown = 300;
        this.connected = false;
        this.powerUps = {};
        this.lastPowerUpCollection = 0;
        this.powerUpCooldown = 1000; // 1 second cooldown between collections
    }

    preload() {
        // We'll create graphics programmatically instead of loading images
    }

    create() {
        console.log('Game scene created');

        // Initialize socket connection
        this.socket = io();

        // Create input controls (movement by arrows only; Space to shoot)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Socket event listeners
        this.setupSocketListeners();

        // Create background
        this.add.rectangle(800, 500, 1600, 1000, 0x34495e);

        // Add border
        this.add.rectangle(800, 500, 1600, 1000).setStrokeStyle(4, 0x2c3e50);

        // Add instructions text
        this.add.text(800, 50, 'Rock-Paper-Scissors Tank Battle!', {
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(800, 85, 'Arrows to move, SPACE to shoot', {
            fontSize: '18px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Add type effectiveness guide
        this.add.text(800, 930, '🗿 can ONLY damage ✂️  |  📄 can ONLY damage 🗿  |  ✂️ can ONLY damage 📄', {
            fontSize: '16px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Add game mode info
        this.add.text(800, 960, '🏆 5-MINUTE ROUNDS: Get the most kills to win! Dead players respawn after 3 seconds with reset kill count.', {
            fontSize: '14px',
            fill: '#f39c12',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Add round timer (will be updated dynamically)
        this.roundTimer = this.add.text(800, 120, 'Round Time: 5:00', {
            fontSize: '18px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Add transformation timer (smaller now)
        this.transformationTimer = this.add.text(800, 145, 'Next transformation in: 30s', {
            fontSize: '14px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Add leaderboard
        this.leaderboardText = this.add.text(50, 120, 'LEADERBOARD\n', {
            fontSize: '16px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0);
        
        // Start countdown
        this.nextTransformation = Date.now() + 30000;
        this.updateTransformationTimer();
    }

    setupSocketListeners() {
        this.socket.on('currentPlayers', (players) => {
            console.log('Received current players:', players);
            Object.keys(players).forEach((id) => {
                if (players[id].id === this.socket.id) {
                    console.log('Adding current player:', players[id]);
                    this.addPlayer(players[id], true);
                } else {
                    console.log('Adding other player:', players[id]);
                    this.addPlayer(players[id], false);
                }
            });
            this.updatePlayerCount();
        });

        this.socket.on('newPlayer', (playerInfo) => {
            this.addPlayer(playerInfo, false);
            this.updatePlayerCount();
        });

        this.socket.on('playerDisconnected', (playerId) => {
            if (this.players[playerId]) {
                this.players[playerId].destroy();
                delete this.players[playerId];
            }
            this.updatePlayerCount();
        });

        this.socket.on('playerMoved', (playerInfo) => {
            if (this.players[playerInfo.id]) {
                this.players[playerInfo.id].setPosition(playerInfo.x, playerInfo.y);
                this.players[playerInfo.id].setRotation(playerInfo.rotation);
            }
        });

        this.socket.on('newBullet', (bulletData) => {
            this.createBullet(bulletData);
        });

        this.socket.on('playerHealthUpdate', (data) => {
            if (data.playerId === this.socket.id) {
                this.updateHealthUI(data.health);

                // Show damage effectiveness
                if (data.damage) {
                    this.showDamageEffect(data.damage, data.shooterType, data.targetType);
                }

                // If current player dies, disable controls and show spectator mode
                if (!data.alive) {
                    this.playerTank = null;
                    this.updateStatusText('You are eliminated! Spectating...', '#e74c3c');
                }
            }

            if (!data.alive && this.players[data.playerId]) {
                // Create death explosion effect
                const player = this.players[data.playerId];
                const explosion = this.add.circle(player.x, player.y, 30, 0xff0000);

                // Add explosion particles
                for (let i = 0; i < 8; i++) {
                    const particle = this.add.circle(
                        player.x + (Math.random() - 0.5) * 20,
                        player.y + (Math.random() - 0.5) * 20,
                        Math.random() * 5 + 2,
                        0xff4444
                    );

                    this.tweens.add({
                        targets: particle,
                        x: particle.x + (Math.random() - 0.5) * 100,
                        y: particle.y + (Math.random() - 0.5) * 100,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => particle.destroy()
                    });
                }

                this.tweens.add({
                    targets: explosion,
                    alpha: 0,
                    scaleX: 3,
                    scaleY: 3,
                    duration: 500,
                    onComplete: () => explosion.destroy()
                });

                // Remove the dead player's tank from the field
                this.players[data.playerId].destroy();
                delete this.players[data.playerId];

                this.updatePlayerCount();
            }
        });

        this.socket.on('gameOver', (data) => {
            this.showGameOver(data.winner);
        });

        // Power-up system listeners
        this.socket.on('newPowerUp', (powerUpData) => {
            console.log('📦 CREATING NEW POWER-UP:', powerUpData);
            this.createPowerUp(powerUpData);
            console.log(`Total power-ups now: ${Object.keys(this.powerUps).length}`);
        });

        this.socket.on('removePowerUp', (powerUpId) => {
            console.log('🗑️ REMOVING POWER-UP:', powerUpId);
            if (this.powerUps[powerUpId]) {
                this.powerUps[powerUpId].destroy();
                delete this.powerUps[powerUpId];
                console.log(`Power-up ${powerUpId} removed. Remaining: ${Object.keys(this.powerUps).length}`);
            } else {
                console.log(`Power-up ${powerUpId} not found for removal`);
            }
        });

        this.socket.on('playerTypeChanged', (data) => {
            console.log(`RECEIVED TRANSFORMATION: Player ${data.playerId} changed from ${data.oldType} to ${data.newType}`);

            if (this.players[data.playerId]) {
                console.log(`APPLYING TRANSFORMATION to player ${data.playerId}`);

                // INSTANT visual transformation - no delays or animations
                this.updatePlayerType(data.playerId, data.newType, data.newColor);

                // Add multiple instant visual effects for maximum clarity
                this.createTransformationFlash(this.players[data.playerId]);
                this.createTransformationRing(this.players[data.playerId]);

                if (data.playerId === this.socket.id) {
                    console.log(`TRANSFORMING CURRENT PLAYER from ${data.oldType} to ${data.newType}`);

                    // Update tank type IMMEDIATELY
                    this.playerTank.tankType = data.newType;
                    this.updateTankTypeUI(data.newType);
                    this.showTypeChangeEffect(data.oldType, data.newType);

                    // Add screen flash for current player to emphasize the change
                    this.createScreenFlash();
                }
            } else {
                console.log(`ERROR: Player ${data.playerId} not found in players list`);
            }
        });

        this.socket.on('transformationEvent', (data) => {
            console.log('🌟 MASS TRANSFORMATION EVENT:', data.message);
            this.showMassTransformationEffect(data.message);
        });

        this.socket.on('killCountUpdate', (data) => {
            console.log('💀 KILL COUNT UPDATE:', data);
            this.updateLeaderboard(data.leaderboard);
        });

        this.socket.on('playerRespawned', (data) => {
            console.log('🔄 PLAYER RESPAWNED:', data.playerId);
            if (data.playerId === this.socket.id) {
                // Current player respawned
                this.showRespawnMessage();
            }
            this.updateLeaderboard(data.leaderboard);
        });

        this.socket.on('roundTimeUpdate', (data) => {
            this.updateRoundTimer(data.timeLeft);
            this.updateLeaderboard(data.leaderboard);
        });

        this.socket.on('roundEnded', (data) => {
            console.log('🏁 ROUND ENDED:', data);
            this.showRoundEndScreen(data);
        });

        this.socket.on('roundStarted', (data) => {
            console.log('🚀 NEW ROUND STARTED:', data);
            this.showRoundStartMessage(data.message);
            this.hideRoundEndScreen();
        });
    }

    addPlayer(playerInfo, isCurrentPlayer) {
        // Tank characteristics based on type
        const tankSpecs = {
            rock: { size: 45, barrelWidth: 6, symbol: '🗿', name: 'Rock Tank' },
            paper: { size: 40, barrelWidth: 4, symbol: '📄', name: 'Paper Tank' },
            scissors: { size: 35, barrelWidth: 3, symbol: '✂️', name: 'Scissors Tank' }
        };

        const spec = tankSpecs[playerInfo.type];

        // Create tank body with type-specific size
        const tank = this.add.rectangle(0, 0, spec.size, spec.size * 0.75, playerInfo.color);
        tank.setStrokeStyle(2, 0x000000);

        // Add tank barrel with type-specific width
        const barrel = this.add.rectangle(0, -spec.size / 3, spec.barrelWidth, spec.size / 2, 0x000000);
        barrel.setOrigin(0.5, 1);

        // Create type indicator
        const typeText = this.add.text(0, 0, spec.symbol, {
            fontSize: '16px',
            fill: '#ffffff'
        });
        typeText.setOrigin(0.5);

        // Create player name and type text
        const nameText = this.add.text(0, -spec.size / 2 - 10, spec.name, {
            fontSize: '10px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        });
        nameText.setOrigin(0.5);

        // Group tank, barrel, symbol, and name
        const tankGroup = this.add.container(playerInfo.x, playerInfo.y, [tank, barrel, typeText, nameText]);
        tankGroup.setSize(spec.size, spec.size);
        tankGroup.tankType = playerInfo.type;

        this.players[playerInfo.id] = tankGroup;

        if (isCurrentPlayer) {
            this.playerTank = tankGroup;
            this.playerTank.playerId = playerInfo.id;
            this.playerTank.tankType = playerInfo.type;
            // Make current player's tank slightly larger
            tankGroup.setScale(1.1);

            // Update UI to show tank type
            this.updateTankTypeUI(playerInfo.type);
        }
    }

    createBullet(bulletData) {
        const bullet = this.add.circle(
            bulletData.x,
            bulletData.y,
            bulletData.size || 3,
            bulletData.color || 0xffff00
        );
        bullet.setStrokeStyle(1, 0x000000);

        this.bullets[bulletData.id] = {
            sprite: bullet,
            velocityX: bulletData.velocityX,
            velocityY: bulletData.velocityY,
            playerId: bulletData.playerId,
            type: bulletData.type
        };
    }

    update() {
        if (this.playerTank) {
            this.handlePlayerInput();
        }
        this.updateBullets();
        this.checkCollisions();
        this.checkPowerUpCollisions();
        this.updateTransformationTimer();
    }

    handlePlayerInput() {
        // Tank type affects speed and rotation
        const tankStats = {
            rock: { speed: 120, rotationSpeed: 2, cooldown: 500 },     // Slow, strong
            paper: { speed: 180, rotationSpeed: 2.5, cooldown: 350 },  // Balanced
            scissors: { speed: 240, rotationSpeed: 3.5, cooldown: 200 } // Fast, weak
        };

        const stats = tankStats[this.playerTank.tankType] || tankStats.paper;
        const speed = stats.speed;
        const rotationSpeed = stats.rotationSpeed;
        this.shootCooldown = stats.cooldown;

        let moved = false;
        let velocityX = 0;
        let velocityY = 0;
        let rotation = this.playerTank.rotation;

        // Rotation
        if (this.cursors.left.isDown) {
            rotation -= rotationSpeed * (1 / 60);
            moved = true;
        }
        if (this.cursors.right.isDown) {
            rotation += rotationSpeed * (1 / 60);
            moved = true;
        }

        // Movement
        if (this.cursors.up.isDown) {
            velocityX = Math.cos(rotation - Math.PI / 2) * speed * (1 / 60);
            velocityY = Math.sin(rotation - Math.PI / 2) * speed * (1 / 60);
            moved = true;
        }
        if (this.cursors.down.isDown) {
            velocityX = -Math.cos(rotation - Math.PI / 2) * speed * (1 / 60);
            velocityY = -Math.sin(rotation - Math.PI / 2) * speed * (1 / 60);
            moved = true;
        }

        // Update position
        let newX = this.playerTank.x + velocityX;
        let newY = this.playerTank.y + velocityY;

        // Keep tank within bounds
        newX = Phaser.Math.Clamp(newX, 40, 1560);
        newY = Phaser.Math.Clamp(newY, 40, 960);

        this.playerTank.setPosition(newX, newY);
        this.playerTank.setRotation(rotation);

        // Send movement to server
        if (moved) {
            this.socket.emit('playerMovement', {
                x: newX,
                y: newY,
                rotation: rotation
            });
        }

        // Shooting
        if (this.spaceKey.isDown && this.time.now > this.lastShot + this.shootCooldown) {
            this.shoot();
            this.lastShot = this.time.now;
        }
    }

    shoot() {
        // Bullet characteristics based on tank type
        const bulletStats = {
            rock: { speed: 300, size: 5, color: 0xff4444 },     // Slow, big bullets
            paper: { speed: 400, size: 3, color: 0x4444ff },    // Normal bullets
            scissors: { speed: 500, size: 2, color: 0x44ff44 }  // Fast, small bullets
        };

        const stats = bulletStats[this.playerTank.tankType] || bulletStats.paper;
        const angle = this.playerTank.rotation - Math.PI / 2;

        const bulletData = {
            x: this.playerTank.x + Math.cos(angle) * 25,
            y: this.playerTank.y + Math.sin(angle) * 25,
            velocityX: Math.cos(angle) * stats.speed,
            velocityY: Math.sin(angle) * stats.speed,
            rotation: this.playerTank.rotation,
            type: this.playerTank.tankType,
            size: stats.size,
            color: stats.color
        };

        this.socket.emit('shoot', bulletData);
    }

    updateBullets() {
        Object.keys(this.bullets).forEach(bulletId => {
            const bullet = this.bullets[bulletId];

            bullet.sprite.x += bullet.velocityX * (1 / 60);
            bullet.sprite.y += bullet.velocityY * (1 / 60);

            // Remove bullets that go off screen
            if (bullet.sprite.x < 0 || bullet.sprite.x > 1600 ||
                bullet.sprite.y < 0 || bullet.sprite.y > 1000) {
                bullet.sprite.destroy();
                delete this.bullets[bulletId];
            }
        });
    }

    checkCollisions() {
        Object.keys(this.bullets).forEach(bulletId => {
            const bullet = this.bullets[bulletId];

            Object.keys(this.players).forEach(playerId => {
                const player = this.players[playerId];

                // Don't check collision with bullet owner
                if (bullet.playerId === playerId) return;

                const distance = Phaser.Math.Distance.Between(
                    bullet.sprite.x, bullet.sprite.y,
                    player.x, player.y
                );

                if (distance < 25) {
                    // Hit detected
                    this.socket.emit('playerHit', {
                        playerId: playerId,
                        shooterId: bullet.playerId
                    });

                    // Remove bullet
                    bullet.sprite.destroy();
                    delete this.bullets[bulletId];

                    // Create hit effect
                    const explosion = this.add.circle(player.x, player.y, 15, 0xff0000);
                    this.tweens.add({
                        targets: explosion,
                        alpha: 0,
                        scaleX: 2,
                        scaleY: 2,
                        duration: 200,
                        onComplete: () => explosion.destroy()
                    });

                    return; // Exit early since bullet hit something
                }
            });
        });
    }

    updateHealthUI(health) {
        document.getElementById('health-text').textContent = health;
        document.getElementById('health-fill').style.width = health + '%';

        if (health <= 0) {
            document.getElementById('health-fill').style.background = '#e74c3c';
        } else if (health <= 25) {
            document.getElementById('health-fill').style.background = '#f39c12';
        } else {
            document.getElementById('health-fill').style.background = '#27ae60';
        }
    }

    updatePlayerCount() {
        const count = Object.keys(this.players).length;
        document.getElementById('player-count').textContent = count;

        // Show alive players count
        const aliveCount = Object.values(this.players).filter(p => p.active !== false).length;
        if (aliveCount !== count) {
            document.getElementById('player-count').textContent = `${aliveCount}/${count}`;
        }
    }

    showGameOver(winner) {
        const gameOverDiv = document.getElementById('game-over');
        const gameOverText = document.getElementById('game-over-text');

        if (winner && winner.id === this.socket.id) {
            gameOverText.textContent = 'Victory! You are the last tank standing!';
            gameOverText.style.color = '#27ae60';
        } else if (winner) {
            gameOverText.textContent = 'Game Over! Another tank won the battle.';
            gameOverText.style.color = '#e74c3c';
        } else {
            gameOverText.textContent = 'Draw! All tanks destroyed!';
            gameOverText.style.color = '#f39c12';
        }

        gameOverDiv.style.display = 'block';
    }

    updateStatusText(text, color = '#ffffff') {
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = text;
            statusElement.style.color = color;
        }
    }

    updateTankTypeUI(tankType) {
        const typeNames = {
            rock: 'Rock Tank 🗿',
            paper: 'Paper Tank 📄',
            scissors: 'Scissors Tank ✂️'
        };

        const advantages = {
            rock: 'Can ONLY damage Scissors ✂️',
            paper: 'Can ONLY damage Rock 🗿',
            scissors: 'Can ONLY damage Paper 📄'
        };

        this.updateStatusText(`${typeNames[tankType]} - ${advantages[tankType]}`, '#f39c12');
    }

    showDamageEffect(damage, shooterType, targetType) {
        let effectText = '';
        let color = '#ffffff';

        if (damage > 0) {
            effectText = 'EFFECTIVE HIT! -' + damage;
            color = '#e74c3c';
        } else {
            effectText = 'NO DAMAGE - Wrong target!';
            color = '#95a5a6';
        }

        // Show floating damage text
        if (this.playerTank) {
            const damageText = this.add.text(this.playerTank.x, this.playerTank.y - 40, effectText, {
                fontSize: '14px',
                fill: color,
                stroke: '#000000',
                strokeThickness: 2
            });
            damageText.setOrigin(0.5);

            this.tweens.add({
                targets: damageText,
                y: damageText.y - 30,
                alpha: 0,
                duration: 1500,
                onComplete: () => damageText.destroy()
            });
        }
    }

    createPowerUp(powerUpData) {
        console.log(`Creating power-up: ${powerUpData.type} at (${powerUpData.x}, ${powerUpData.y}) with ID ${powerUpData.id}`);

        const typeSymbols = {
            rock: '🗿',
            paper: '📄',
            scissors: '✂️'
        };

        const typeColors = {
            rock: 0xff4444,
            paper: 0x4444ff,
            scissors: 0x44ff44
        };

        // Create power-up background circle
        const background = this.add.circle(powerUpData.x, powerUpData.y, 30, typeColors[powerUpData.type]);
        background.setStrokeStyle(4, 0xffffff);
        background.setAlpha(0.9);

        // Create power-up symbol
        const symbol = this.add.text(powerUpData.x, powerUpData.y, typeSymbols[powerUpData.type], {
            fontSize: '28px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        symbol.setOrigin(0.5);

        // Create container (static, no animation)
        const powerUpContainer = this.add.container(powerUpData.x, powerUpData.y, [background, symbol]);
        powerUpContainer.powerUpId = powerUpData.id;
        powerUpContainer.powerUpType = powerUpData.type;

        this.powerUps[powerUpData.id] = powerUpContainer;

        console.log(`✅ Power-up created and stored. Total power-ups: ${Object.keys(this.powerUps).length}`);
        console.log(`Power-up container position: (${powerUpContainer.x}, ${powerUpContainer.y})`);
    }

    updatePlayerType(playerId, newType, newColor) {
        console.log(`UPDATING PLAYER TYPE: ${playerId} to ${newType} with color ${newColor.toString(16)}`);

        if (this.players[playerId]) {
            const player = this.players[playerId];
            const tankSpecs = {
                rock: { size: 45, barrelWidth: 6, symbol: '🗿', name: 'Rock Tank' },
                paper: { size: 40, barrelWidth: 4, symbol: '📄', name: 'Paper Tank' },
                scissors: { size: 35, barrelWidth: 3, symbol: '✂️', name: 'Scissors Tank' }
            };

            const spec = tankSpecs[newType];
            console.log(`Tank spec for ${newType}:`, spec);

            // INSTANT transformation - all changes happen immediately
            // Update tank body color and size
            const tankBody = player.list[0];
            const barrel = player.list[1];
            const symbol = player.list[2];
            const nameText = player.list[3];

            console.log(`Before transformation - Tank body color: ${tankBody.fillColor.toString(16)}`);

            // Update tank body
            tankBody.fillColor = newColor;
            tankBody.width = spec.size;
            tankBody.height = spec.size * 0.75;

            // Update barrel
            barrel.width = spec.barrelWidth;
            barrel.height = spec.size / 2;

            // Update symbol with larger, more visible text
            symbol.setText(spec.symbol);
            symbol.setFontSize('24px'); // Even larger for better visibility

            // Update name
            nameText.setText(spec.name);
            nameText.setColor('#ffffff');
            nameText.setStroke('#000000', 2);

            // Store the new type
            player.tankType = newType;

            console.log(`After transformation - Tank body color: ${tankBody.fillColor.toString(16)}, Symbol: ${symbol.text}`);

            // Force immediate visual refresh by marking as dirty
            tankBody.setDirty();
            barrel.setDirty();
            symbol.setDirty();
            nameText.setDirty();

            console.log(`✅ TRANSFORMATION APPLIED to player ${playerId}`);
        } else {
            console.log(`❌ Player ${playerId} not found for transformation`);
        }
    }

    showTypeChangeEffect(oldType, newType) {
        const typeNames = {
            rock: 'Rock Tank 🗿',
            paper: 'Paper Tank 📄',
            scissors: 'Scissors Tank ✂️'
        };

        if (this.playerTank) {
            // Large, prominent transformation text
            const changeText = this.add.text(this.playerTank.x, this.playerTank.y - 80,
                `TRANSFORMED!\n${typeNames[oldType]} → ${typeNames[newType]}`, {
                fontSize: '20px',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            changeText.setOrigin(0.5);

            // Make it pulse for attention
            this.tweens.add({
                targets: changeText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
                repeat: 2
            });

            this.tweens.add({
                targets: changeText,
                y: changeText.y - 50,
                alpha: 0,
                duration: 2500,
                delay: 500,
                onComplete: () => changeText.destroy()
            });
        }
    }

    createTransformationFlash(player) {
        // Create instant bright flash effect to show transformation
        const flash = this.add.circle(player.x, player.y, 80, 0xffffff);
        flash.setAlpha(1.0);

        this.tweens.add({
            targets: flash,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 200,
            ease: 'Power3',
            onComplete: () => flash.destroy()
        });
    }

    createTransformationRing(player) {
        // Create expanding ring effect for additional visual feedback
        const ring = this.add.circle(player.x, player.y, 40, 0x000000, 0);
        ring.setStrokeStyle(6, 0xffffff);

        this.tweens.add({
            targets: ring,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });
    }

    createScreenFlash() {
        // Create brief screen flash for current player
        const screenFlash = this.add.rectangle(800, 500, 1600, 1000, 0xffffff);
        screenFlash.setAlpha(0.3);

        this.tweens.add({
            targets: screenFlash,
            alpha: 0,
            duration: 150,
            ease: 'Power2',
            onComplete: () => screenFlash.destroy()
        });
    }

    checkPowerUpCollisions() {
        if (!this.playerTank) {
            console.log('No player tank for collision detection');
            return;
        }

        const powerUpCount = Object.keys(this.powerUps).length;
        if (powerUpCount === 0) {
            // Only log this occasionally to avoid spam
            if (Math.random() < 0.01) {
                console.log('No power-ups available for collection');
            }
            return;
        }

        // Only log occasionally to reduce spam
        if (Math.random() < 0.1) {
            console.log(`Checking collisions with ${powerUpCount} power-ups. Player at (${Math.floor(this.playerTank.x)}, ${Math.floor(this.playerTank.y)})`);
        }

        Object.keys(this.powerUps).forEach(powerUpId => {
            const powerUp = this.powerUps[powerUpId];

            const distance = Phaser.Math.Distance.Between(
                this.playerTank.x, this.playerTank.y,
                powerUp.x, powerUp.y
            );

            // Only log when close to reduce spam
            if (distance < 60) {
                console.log(`📍 Power-up ${powerUpId} at (${Math.floor(powerUp.x)}, ${Math.floor(powerUp.y)}) - Distance: ${Math.floor(distance)}`);
            }

            // Precise collision area - tank center must be within power-up radius
            // Power-up has radius 30, so collision should be around 35-40 pixels
            if (distance < 40) {
                // Check cooldown to prevent rapid multiple collections
                const now = this.time.now;
                if (now - this.lastPowerUpCollection < this.powerUpCooldown) {
                    console.log(`⏰ Power-up collection on cooldown`);
                    return;
                }

                console.log(`🎯 COLLECTING POWER-UP: ${powerUp.powerUpType} at distance ${distance}`);
                this.lastPowerUpCollection = now;

                // Create immediate collection effect
                this.createPowerUpCollectionEffect(powerUp);

                // Collect power-up instantly
                this.socket.emit('collectPowerUp', { 
                    powerUpId: powerUpId,
                    type: powerUp.powerUpType
                });

                // Immediately remove from local display to prevent double collection
                if (this.powerUps[powerUpId]) {
                    this.powerUps[powerUpId].destroy();
                    delete this.powerUps[powerUpId];
                }
            }
        });
    }

    createPowerUpCollectionEffect(powerUp) {
        // Create instant collection burst effect
        const burst = this.add.circle(powerUp.x, powerUp.y, 20, 0xffff00);
        burst.setAlpha(0.8);

        // Create particles flying toward player
        for (let i = 0; i < 6; i++) {
            const particle = this.add.circle(
                powerUp.x + (Math.random() - 0.5) * 30,
                powerUp.y + (Math.random() - 0.5) * 30,
                Math.random() * 4 + 2,
                0xffffff
            );

            this.tweens.add({
                targets: particle,
                x: this.playerTank.x,
                y: this.playerTank.y,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        this.tweens.add({
            targets: burst,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 200,
            onComplete: () => burst.destroy()
        });
    }

    updateTransformationTimer() {
        if (this.transformationTimer) {
            const timeLeft = Math.max(0, this.nextTransformation - Date.now());
            const seconds = Math.ceil(timeLeft / 1000);
            
            if (seconds > 0) {
                this.transformationTimer.setText(`Next transformation in: ${seconds}s`);
                
                // Change color as countdown gets lower
                if (seconds <= 5) {
                    this.transformationTimer.setColor('#ff0000'); // Red
                } else if (seconds <= 10) {
                    this.transformationTimer.setColor('#ff8800'); // Orange
                } else {
                    this.transformationTimer.setColor('#ffff00'); // Yellow
                }
            } else {
                this.transformationTimer.setText('Transformation imminent...');
                this.transformationTimer.setColor('#ff0000');
                // Reset timer for next cycle
                this.nextTransformation = Date.now() + 30000;
            }
        }
    }

    showMassTransformationEffect(message) {
        // Create screen-wide transformation announcement
        const announcement = this.add.text(800, 500, message, {
            fontSize: '32px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);
        
        // Create pulsing effect
        this.tweens.add({
            targets: announcement,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            repeat: 3
        });
        
        // Fade out after 3 seconds
        this.tweens.add({
            targets: announcement,
            alpha: 0,
            duration: 1000,
            delay: 2000,
            onComplete: () => announcement.destroy()
        });
        
        // Create screen flash effect
        const screenFlash = this.add.rectangle(800, 500, 1600, 1000, 0xffff00);
        screenFlash.setAlpha(0.3);
        
        this.tweens.add({
            targets: screenFlash,
            alpha: 0,
            duration: 500,
            onComplete: () => screenFlash.destroy()
        });
        
        // Reset transformation timer
        this.nextTransformation = Date.now() + 30000;
    }

    updateRoundTimer(timeLeft) {
        if (this.roundTimer) {
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            this.roundTimer.setText(`Round Time: ${timeString}`);
            
            // Change color as time runs out
            if (timeLeft < 60000) { // Last minute
                this.roundTimer.setColor('#ff0000');
            } else if (timeLeft < 120000) { // Last 2 minutes
                this.roundTimer.setColor('#ff8800');
            } else {
                this.roundTimer.setColor('#00ff00');
            }
        }
    }

    updateLeaderboard(leaderboard) {
        if (this.leaderboardText && leaderboard) {
            let text = 'LEADERBOARD\n';
            leaderboard.slice(0, 5).forEach((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                text += `${medal} ${player.playerId.substring(0, 8)}: ${player.kills} kills\n`;
            });
            this.leaderboardText.setText(text);
        }
    }

    showRespawnMessage() {
        const respawnText = this.add.text(800, 400, 'YOU RESPAWNED!\nKill count reset to 0', {
            fontSize: '24px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: respawnText,
            alpha: 0,
            duration: 2000,
            onComplete: () => respawnText.destroy()
        });
    }

    showRoundEndScreen(data) {
        // Create semi-transparent overlay
        this.roundEndOverlay = this.add.rectangle(800, 500, 1600, 1000, 0x000000);
        this.roundEndOverlay.setAlpha(0.8);
        
        // Show winner and leaderboard
        let message = '🏁 ROUND ENDED!\n\n';
        if (data.winner) {
            message += `🏆 WINNER: ${data.winner.playerId.substring(0, 12)}\n`;
            message += `💀 Kills: ${data.winner.kills}\n\n`;
        }
        message += 'FINAL LEADERBOARD:\n';
        
        data.leaderboard.slice(0, 5).forEach((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            message += `${medal} ${player.playerId.substring(0, 10)}: ${player.kills} kills\n`;
        });
        
        message += '\nNew round starting in 10 seconds...';
        
        this.roundEndText = this.add.text(800, 500, message, {
            fontSize: '20px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
    }

    hideRoundEndScreen() {
        if (this.roundEndOverlay) {
            this.roundEndOverlay.destroy();
            this.roundEndOverlay = null;
        }
        if (this.roundEndText) {
            this.roundEndText.destroy();
            this.roundEndText = null;
        }
    }

    showRoundStartMessage(message) {
        const startText = this.add.text(800, 300, message, {
            fontSize: '28px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: startText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            repeat: 2
        });
        
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 1000,
            delay: 3000,
            onComplete: () => startText.destroy()
        });
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 1000,
    parent: 'game-container',
    backgroundColor: '#34495e',
    scene: TankBattleGame,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

// Start the game
const game = new Phaser.Game(config);
