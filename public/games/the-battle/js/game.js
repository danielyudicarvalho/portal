class TankBattleGame extends Phaser.Scene {
    constructor() {
        super({ key: 'TankBattleGame' });
        this.players = {};
        this.bullets = {};
        this.cursors = null;
        this.spaceKey = null;
        this.playerTank = null;
        this.lastShot = 0;
        this.shootCooldown = 300;
        this.powerUps = {};
        this.aiTanks = [];
        this.gameStarted = false;
        this.playerHealth = 100;
        this.score = 0;
    }

    preload() {
        // We'll create graphics programmatically instead of loading images
    }

    create() {
        console.log('Game scene created');

        // Create input controls (movement by arrows only; Space to shoot)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Ensure the game canvas can receive focus
        this.input.keyboard.enabled = true;
        this.input.keyboard.capture = [
            Phaser.Input.Keyboard.KeyCodes.SPACE,
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.DOWN,
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT
        ];

        // Create background
        this.add.rectangle(800, 500, 1600, 1000, 0x34495e);

        // Add border
        this.add.rectangle(800, 500, 1600, 1000).setStrokeStyle(4, 0x2c3e50);

        // Add instructions text
        this.add.text(800, 50, 'The Battle - Tank Combat Demo', {
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(800, 85, 'Arrows to move, SPACE to shoot. Defeat AI tanks!', {
            fontSize: '18px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Add tank type legend
        this.add.text(800, 120, '🗿 Rock (Red) beats ✂️ Scissors | 📄 Paper (Blue) beats 🗿 Rock | ✂️ Scissors (Green) beats 📄 Paper', {
            fontSize: '16px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Create player tank
        this.createPlayerTank();

        // Create AI tanks
        this.createAITanks();

        // Add click handler to focus the game
        this.input.on('pointerdown', () => {
            this.game.canvas.focus();
            console.log('Game canvas focused');
        });

        // Add keyboard debug
        this.input.keyboard.on('keydown', (event) => {
            console.log('Phaser key pressed:', event.code, event.key);
        });
        
        // Add direct keyboard event listeners as backup
        this.directKeys = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false
        };
        
        // Direct DOM event listeners
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (e) => {
                switch(e.code) {
                    case 'ArrowLeft': this.directKeys.left = true; break;
                    case 'ArrowRight': this.directKeys.right = true; break;
                    case 'ArrowUp': this.directKeys.up = true; break;
                    case 'ArrowDown': this.directKeys.down = true; break;
                    case 'Space': this.directKeys.space = true; break;
                }
                console.log('Direct key down:', e.code, this.directKeys);
            });
            
            window.addEventListener('keyup', (e) => {
                switch(e.code) {
                    case 'ArrowLeft': this.directKeys.left = false; break;
                    case 'ArrowRight': this.directKeys.right = false; break;
                    case 'ArrowUp': this.directKeys.up = false; break;
                    case 'ArrowDown': this.directKeys.down = false; break;
                    case 'Space': this.directKeys.space = false; break;
                }
            });
        }

        // Start game
        this.gameStarted = true;

        // Update UI
        this.updateUI();
        
        // Add key status display for debugging
        this.keyStatusText = this.add.text(10, 150, 'Keys: None', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });

        // Spawn power-ups periodically
        this.time.addEvent({
            delay: 10000, // Every 10 seconds
            callback: this.spawnPowerUp,
            callbackScope: this,
            loop: true
        });
    }

    createPlayerTank() {
        // Random tank type for player
        const tankTypes = ['rock', 'paper', 'scissors'];
        const tankType = tankTypes[Math.floor(Math.random() * 3)];
        
        const tankColors = {
            rock: 0xff4444,    // Red
            paper: 0x4444ff,   // Blue
            scissors: 0x44ff44 // Green
        };

        // Create player tank
        this.playerTank = this.add.circle(400, 500, 20, tankColors[tankType]);
        this.playerTank.setStrokeStyle(3, 0xffffff);
        this.playerTank.type = tankType;
        this.playerTank.health = 100;
        this.playerTank.rotation = 0;
        this.playerTank.isPlayer = true;

        // Add tank type indicator
        const typeEmojis = { rock: '🗿', paper: '📄', scissors: '✂️' };
        this.playerTank.typeText = this.add.text(this.playerTank.x, this.playerTank.y - 35, typeEmojis[tankType], {
            fontSize: '20px'
        }).setOrigin(0.5);

        console.log(`Player tank type: ${tankType}`);
    }

    createAITanks() {
        const tankTypes = ['rock', 'paper', 'scissors'];
        const tankColors = {
            rock: 0xff4444,
            paper: 0x4444ff,
            scissors: 0x44ff44
        };
        const typeEmojis = { rock: '🗿', paper: '📄', scissors: '✂️' };

        // Create 5 AI tanks
        for (let i = 0; i < 5; i++) {
            const tankType = tankTypes[Math.floor(Math.random() * 3)];
            const x = Math.random() * 1400 + 100;
            const y = Math.random() * 800 + 150;

            const aiTank = this.add.circle(x, y, 18, tankColors[tankType]);
            aiTank.setStrokeStyle(2, 0x888888);
            aiTank.type = tankType;
            aiTank.health = 100;
            aiTank.rotation = Math.random() * Math.PI * 2;
            aiTank.isPlayer = false;
            aiTank.lastShot = 0;
            aiTank.moveDirection = Math.random() * Math.PI * 2;
            aiTank.lastDirectionChange = 0;

            // Add type indicator
            aiTank.typeText = this.add.text(aiTank.x, aiTank.y - 30, typeEmojis[tankType], {
                fontSize: '16px'
            }).setOrigin(0.5);

            this.aiTanks.push(aiTank);
        }
    }

    update(time, delta) {
        if (!this.gameStarted) return;

        // Handle player input
        this.handlePlayerInput();

        // Update AI tanks
        this.updateAITanks(time);

        // Update bullets
        this.updateBullets();

        // Check collisions
        this.checkCollisions();

        // Update UI
        this.updateUI();
    }

    handlePlayerInput() {
        if (!this.playerTank || this.playerTank.health <= 0) return;

        const speed = this.getSpeedForType(this.playerTank.type);
        let moved = false;

        // Multiple input checking methods
        let leftPressed = false, rightPressed = false, upPressed = false, downPressed = false, spacePressed = false;
        
        // Space key
        if (this.spaceKey && this.spaceKey.isDown) spacePressed = true;
        
        // Method 2: Check Phaser arrow keys
        if (this.cursors) {
            if (this.cursors.left && this.cursors.left.isDown) leftPressed = true;
            if (this.cursors.right && this.cursors.right.isDown) rightPressed = true;
            if (this.cursors.up && this.cursors.up.isDown) upPressed = true;
            if (this.cursors.down && this.cursors.down.isDown) downPressed = true;
        }
        
        // Method 3: Check direct DOM keys (fallback)
        if (this.directKeys) {
            if (this.directKeys.left) leftPressed = true;
            if (this.directKeys.right) rightPressed = true;
            if (this.directKeys.up) upPressed = true;
            if (this.directKeys.down) downPressed = true;
            if (this.directKeys.space) spacePressed = true;
        }

        // Movement - Left/Right rotates the tank
        if (leftPressed) {
            this.playerTank.rotation -= 0.05;
            moved = true;
        }
        if (rightPressed) {
            this.playerTank.rotation += 0.05;
            moved = true;
        }
        
        // Movement - Up/Down moves the tank forward/backward
        if (upPressed) {
            this.playerTank.x += Math.cos(this.playerTank.rotation) * speed;
            this.playerTank.y += Math.sin(this.playerTank.rotation) * speed;
            moved = true;
        }
        if (downPressed) {
            this.playerTank.x -= Math.cos(this.playerTank.rotation) * speed;
            this.playerTank.y -= Math.sin(this.playerTank.rotation) * speed;
            moved = true;
        }

        // Keep tank in bounds
        this.playerTank.x = Phaser.Math.Clamp(this.playerTank.x, 30, 1570);
        this.playerTank.y = Phaser.Math.Clamp(this.playerTank.y, 160, 970);

        // Update type text position
        if (moved && this.playerTank.typeText) {
            this.playerTank.typeText.setPosition(this.playerTank.x, this.playerTank.y - 35);
        }

        // Shooting
        if (spacePressed && this.time.now - this.lastShot > this.shootCooldown) {
            this.shootBullet(this.playerTank);
            this.lastShot = this.time.now;
        }
        
        // Update key status display for debugging
        const activeKeys = [];
        if (leftPressed) activeKeys.push('LEFT');
        if (rightPressed) activeKeys.push('RIGHT');
        if (upPressed) activeKeys.push('UP');
        if (downPressed) activeKeys.push('DOWN');
        if (spacePressed) activeKeys.push('SPACE');
        
        if (this.keyStatusText) {
            this.keyStatusText.setText(`Keys: ${activeKeys.length > 0 ? activeKeys.join(', ') : 'None'} | Direct: ${JSON.stringify(this.directKeys || {})}`);
        }
    }

    updateAITanks(time) {
        this.aiTanks.forEach(aiTank => {
            if (aiTank.health <= 0) return;

            const speed = this.getSpeedForType(aiTank.type) * 0.7; // AI moves slower

            // Change direction occasionally
            if (time - aiTank.lastDirectionChange > 2000) {
                aiTank.moveDirection = Math.random() * Math.PI * 2;
                aiTank.lastDirectionChange = time;
            }

            // Move AI tank
            aiTank.x += Math.cos(aiTank.moveDirection) * speed;
            aiTank.y += Math.sin(aiTank.moveDirection) * speed;

            // Keep in bounds
            if (aiTank.x < 30 || aiTank.x > 1570 || aiTank.y < 160 || aiTank.y > 970) {
                aiTank.moveDirection += Math.PI; // Reverse direction
            }
            aiTank.x = Phaser.Math.Clamp(aiTank.x, 30, 1570);
            aiTank.y = Phaser.Math.Clamp(aiTank.y, 160, 970);

            // Update type text position
            if (aiTank.typeText) {
                aiTank.typeText.setPosition(aiTank.x, aiTank.y - 30);
            }

            // AI shooting (occasionally)
            if (Math.random() < 0.002 && time - aiTank.lastShot > 1000) {
                // Aim towards player
                if (this.playerTank && this.playerTank.health > 0) {
                    const angle = Phaser.Math.Angle.Between(aiTank.x, aiTank.y, this.playerTank.x, this.playerTank.y);
                    aiTank.rotation = angle;
                    this.shootBullet(aiTank);
                    aiTank.lastShot = time;
                }
            }
        });
    }

    shootBullet(tank) {
        const bulletSpeed = 8;
        const bulletSize = this.getBulletSizeForType(tank.type);
        const bulletColor = this.getBulletColorForType(tank.type);

        const bullet = this.add.circle(
            tank.x + Math.cos(tank.rotation) * 25,
            tank.y + Math.sin(tank.rotation) * 25,
            bulletSize,
            bulletColor
        );

        bullet.velocityX = Math.cos(tank.rotation) * bulletSpeed;
        bullet.velocityY = Math.sin(tank.rotation) * bulletSpeed;
        bullet.shooter = tank;
        bullet.type = tank.type;

        const bulletId = Date.now() + Math.random();
        this.bullets[bulletId] = bullet;
    }

    updateBullets() {
        Object.keys(this.bullets).forEach(bulletId => {
            const bullet = this.bullets[bulletId];
            if (!bullet) return;

            bullet.x += bullet.velocityX;
            bullet.y += bullet.velocityY;

            // Remove bullets that go off screen
            if (bullet.x < 0 || bullet.x > 1600 || bullet.y < 0 || bullet.y > 1000) {
                bullet.destroy();
                delete this.bullets[bulletId];
            }
        });
    }

    checkCollisions() {
        // Check bullet-tank collisions
        Object.keys(this.bullets).forEach(bulletId => {
            const bullet = this.bullets[bulletId];
            if (!bullet) return;

            // Check collision with player
            if (this.playerTank && this.playerTank.health > 0 && bullet.shooter !== this.playerTank) {
                const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.playerTank.x, this.playerTank.y);
                if (distance < 25) {
                    this.handleTankHit(this.playerTank, bullet);
                    bullet.destroy();
                    delete this.bullets[bulletId];
                    return;
                }
            }

            // Check collision with AI tanks
            this.aiTanks.forEach(aiTank => {
                if (aiTank.health <= 0 || bullet.shooter === aiTank) return;

                const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, aiTank.x, aiTank.y);
                if (distance < 23) {
                    this.handleTankHit(aiTank, bullet);
                    bullet.destroy();
                    delete this.bullets[bulletId];
                }
            });
        });
    }

    handleTankHit(tank, bullet) {
        const damage = this.calculateDamage(bullet.type, tank.type);
        
        if (damage > 0) {
            tank.health -= damage;
            console.log(`${bullet.type} hit ${tank.type} for ${damage} damage`);

            if (tank.health <= 0) {
                this.destroyTank(tank);
                if (tank.isPlayer) {
                    this.gameOver();
                } else {
                    this.score += 100;
                }
            }
        } else {
            console.log(`${bullet.type} hit ${tank.type} but dealt no damage (ineffective)`);
        }
    }

    calculateDamage(attackerType, defenderType) {
        // Rock-paper-scissors logic
        if (
            (attackerType === 'rock' && defenderType === 'scissors') ||
            (attackerType === 'paper' && defenderType === 'rock') ||
            (attackerType === 'scissors' && defenderType === 'paper')
        ) {
            return 50; // Effective hit
        }
        return 0; // Ineffective hit
    }

    destroyTank(tank) {
        tank.setAlpha(0.3);
        tank.health = 0;
        if (tank.typeText) {
            tank.typeText.setAlpha(0.3);
        }
    }

    spawnPowerUp() {
        const types = ['rock', 'paper', 'scissors'];
        const type = types[Math.floor(Math.random() * 3)];
        const colors = { rock: 0xff4444, paper: 0x4444ff, scissors: 0x44ff44 };
        const emojis = { rock: '🗿', paper: '📄', scissors: '✂️' };

        const powerUp = this.add.circle(
            Math.random() * 1400 + 100,
            Math.random() * 700 + 200,
            15,
            colors[type]
        );
        powerUp.setStrokeStyle(3, 0xffffff);
        powerUp.type = type;
        powerUp.spawnTime = this.time.now;

        // Add type indicator
        powerUp.typeText = this.add.text(powerUp.x, powerUp.y, emojis[type], {
            fontSize: '14px'
        }).setOrigin(0.5);

        const powerUpId = Date.now() + Math.random();
        this.powerUps[powerUpId] = powerUp;

        // Remove after 8 seconds
        this.time.delayedCall(8000, () => {
            if (this.powerUps[powerUpId]) {
                this.powerUps[powerUpId].destroy();
                if (this.powerUps[powerUpId].typeText) {
                    this.powerUps[powerUpId].typeText.destroy();
                }
                delete this.powerUps[powerUpId];
            }
        });

        // Check for collection
        this.checkPowerUpCollection(powerUpId);
    }

    checkPowerUpCollection(powerUpId) {
        const checkInterval = this.time.addEvent({
            delay: 100,
            callback: () => {
                const powerUp = this.powerUps[powerUpId];
                if (!powerUp || !this.playerTank || this.playerTank.health <= 0) {
                    checkInterval.destroy();
                    return;
                }

                const distance = Phaser.Math.Distance.Between(
                    this.playerTank.x, this.playerTank.y,
                    powerUp.x, powerUp.y
                );

                if (distance < 30) {
                    this.collectPowerUp(powerUpId);
                    checkInterval.destroy();
                }
            },
            loop: true
        });
    }

    collectPowerUp(powerUpId) {
        const powerUp = this.powerUps[powerUpId];
        if (!powerUp || !this.playerTank) return;

        const oldType = this.playerTank.type;
        const newType = powerUp.type;

        // Change player tank type
        this.playerTank.type = newType;
        const tankColors = { rock: 0xff4444, paper: 0x4444ff, scissors: 0x44ff44 };
        const typeEmojis = { rock: '🗿', paper: '📄', scissors: '✂️' };
        
        this.playerTank.setFillStyle(tankColors[newType]);
        this.playerTank.typeText.setText(typeEmojis[newType]);

        console.log(`Transformed from ${oldType} to ${newType}!`);

        // Remove power-up
        powerUp.destroy();
        if (powerUp.typeText) {
            powerUp.typeText.destroy();
        }
        delete this.powerUps[powerUpId];
    }

    getSpeedForType(type) {
        switch (type) {
            case 'rock': return 1.5; // Slow
            case 'paper': return 2.0; // Medium
            case 'scissors': return 2.5; // Fast
            default: return 2.0;
        }
    }

    getBulletSizeForType(type) {
        switch (type) {
            case 'rock': return 8; // Large
            case 'paper': return 6; // Medium
            case 'scissors': return 4; // Small
            default: return 6;
        }
    }

    getBulletColorForType(type) {
        switch (type) {
            case 'rock': return 0xff6666;
            case 'paper': return 0x6666ff;
            case 'scissors': return 0x66ff66;
            default: return 0xffffff;
        }
    }

    updateUI() {
        const healthText = document.getElementById('health-text');
        const healthFill = document.getElementById('health-fill');
        const playerCount = document.getElementById('player-count');
        const statusText = document.getElementById('status-text');

        if (healthText) healthText.textContent = Math.max(0, this.playerTank?.health || 0);
        if (healthFill) healthFill.style.width = `${Math.max(0, (this.playerTank?.health || 0))}%`;
        
        const aliveAI = this.aiTanks.filter(tank => tank.health > 0).length;
        if (playerCount) playerCount.textContent = aliveAI + (this.playerTank?.health > 0 ? 1 : 0);
        
        if (statusText) {
            if (this.playerTank?.health > 0) {
                statusText.textContent = `Score: ${this.score} | Tank Type: ${this.playerTank.type.toUpperCase()}`;
            } else {
                statusText.textContent = `Game Over! Final Score: ${this.score}`;
            }
        }
    }

    gameOver() {
        const gameOverDiv = document.getElementById('game-over');
        const gameOverText = document.getElementById('game-over-text');
        
        if (gameOverDiv) gameOverDiv.style.display = 'block';
        if (gameOverText) gameOverText.textContent = `Game Over! Final Score: ${this.score}`;
        
        this.gameStarted = false;
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
    },
    input: {
        keyboard: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Start the game
const game = new Phaser.Game(config);
