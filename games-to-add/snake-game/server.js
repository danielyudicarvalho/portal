const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game state
const gameState = {
    players: new Map(),
    staticFood: { x: 40, y: 25 },
    tempFood: { x: 20, y: 30 },
    movingFood: { x: 60, y: 20 },
    weaponFood: { x: 15, y: 15 },
    armorFood: { x: 70, y: 35 },
    poisonFood: { x: 30, y: 40 },
    poisonFoodDirection: 'RIGHT',
    poisonFoodTimer: null,
    movingFoodDirection: 'RIGHT',
    projectiles: [],
    gameStarted: false,
    maxPlayers: 8,
    sessionStartTime: Date.now(),
    sessionDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
    gameEnded: false
};

// Player colors
const playerColors = [
    { head: 0x27ae60, body: 0x2ecc71 }, // Green
    { head: 0x8e44ad, body: 0x9b59b6 }, // Purple
    { head: 0xe67e22, body: 0xf39c12 }, // Orange
    { head: 0x2980b9, body: 0x3498db }, // Blue
    { head: 0xe74c3c, body: 0xec7063 }, // Red
    { head: 0xf1c40f, body: 0xf4d03f }, // Yellow
    { head: 0x1abc9c, body: 0x48c9b0 }, // Teal
    { head: 0x95a5a6, body: 0xbdc3c7 }  // Gray
];

// Generate random spawn position
function getRandomSpawnPosition() {
    let position;
    let attempts = 0;
    do {
        position = {
            x: Math.floor(Math.random() * 76) + 2, // 80 - 4 for border
            y: Math.floor(Math.random() * 46) + 2  // 50 - 4 for border
        };
        attempts++;
    } while (isPositionOccupied(position.x, position.y) && attempts < 50);

    return position;
}

function isPositionOccupied(x, y) {
    // Check all players
    for (let [id, player] of gameState.players) {
        if (player.alive && player.snake.some(segment => segment.x === x && segment.y === y)) {
            return true;
        }
    }

    // Check food positions
    if ((gameState.staticFood.x === x && gameState.staticFood.y === y) ||
        (gameState.tempFood.x === x && gameState.tempFood.y === y) ||
        (gameState.movingFood.x === x && gameState.movingFood.y === y) ||
        (gameState.weaponFood.x === x && gameState.weaponFood.y === y) ||
        (gameState.armorFood.x === x && gameState.armorFood.y === y) ||
        (gameState.poisonFood.x === x && gameState.poisonFood.y === y)) {
        return true;
    }

    return false;
}

function spawnFood(type) {
    let position;
    let attempts = 0;
    do {
        position = {
            x: Math.floor(Math.random() * 80), // 80 grid cells wide
            y: Math.floor(Math.random() * 50)  // 50 grid cells tall
        };
        attempts++;
    } while (isPositionOccupied(position.x, position.y) && attempts < 50);

    gameState[type] = position;
    io.emit('foodSpawned', { type, position });
}

function spawnPoisonFood() {
    // Clear existing poison food timer if any
    if (gameState.poisonFoodTimer) {
        clearTimeout(gameState.poisonFoodTimer);
    }

    // Spawn poison food
    spawnFood('poisonFood');

    // Set random initial direction
    const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    gameState.poisonFoodDirection = directions[Math.floor(Math.random() * 4)];

    console.log('Poison food spawned! It will disappear in 20 seconds.');

    // Set timer to remove poison food after 20 seconds
    gameState.poisonFoodTimer = setTimeout(() => {
        gameState.poisonFood = { x: undefined, y: undefined };
        io.emit('poisonFoodExpired');
        console.log('Poison food expired and disappeared.');
        gameState.poisonFoodTimer = null;
    }, 20000); // 20 seconds
}

function moveMovingFood() {
    const currentPos = { ...gameState.movingFood };
    let nextPos = { ...currentPos };

    switch (gameState.movingFoodDirection) {
        case 'LEFT': nextPos.x -= 1; break;
        case 'RIGHT': nextPos.x += 1; break;
        case 'UP': nextPos.y -= 1; break;
        case 'DOWN': nextPos.y += 1; break;
    }

    // Check boundaries and collisions
    const hitWall = nextPos.x < 0 || nextPos.x >= 80 || nextPos.y < 0 || nextPos.y >= 50;
    const hitObstacle = isPositionOccupied(nextPos.x, nextPos.y);

    if (hitWall || hitObstacle) {
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        gameState.movingFoodDirection = directions[Math.floor(Math.random() * 4)];

        // Try new direction
        nextPos = { ...currentPos };
        switch (gameState.movingFoodDirection) {
            case 'LEFT': nextPos.x -= 1; break;
            case 'RIGHT': nextPos.x += 1; break;
            case 'UP': nextPos.y -= 1; break;
            case 'DOWN': nextPos.y += 1; break;
        }

        if (nextPos.x < 0 || nextPos.x >= 80 || nextPos.y < 0 || nextPos.y >= 50 ||
            isPositionOccupied(nextPos.x, nextPos.y)) {
            nextPos = currentPos;
        }
    }

    gameState.movingFood = nextPos;

    // Random direction change (10% chance)
    if (Math.random() < 0.1) {
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        gameState.movingFoodDirection = directions[Math.floor(Math.random() * 4)];
    }
}

function movePoisonFood() {
    // Only move poison food if it exists
    if (gameState.poisonFood.x === undefined || gameState.poisonFood.y === undefined) return;

    const currentPos = { ...gameState.poisonFood };
    let nextPos = { ...currentPos };

    switch (gameState.poisonFoodDirection) {
        case 'LEFT': nextPos.x -= 1; break;
        case 'RIGHT': nextPos.x += 1; break;
        case 'UP': nextPos.y -= 1; break;
        case 'DOWN': nextPos.y += 1; break;
    }

    // Check boundaries - poison food bounces off walls and obstacles
    const hitWall = nextPos.x < 0 || nextPos.x >= 80 || nextPos.y < 0 || nextPos.y >= 50;
    const hitObstacle = isPositionOccupied(nextPos.x, nextPos.y);

    if (hitWall || hitObstacle) {
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        gameState.poisonFoodDirection = directions[Math.floor(Math.random() * 4)];

        // Try new direction
        nextPos = { ...currentPos };
        switch (gameState.poisonFoodDirection) {
            case 'LEFT': nextPos.x -= 1; break;
            case 'RIGHT': nextPos.x += 1; break;
            case 'UP': nextPos.y -= 1; break;
            case 'DOWN': nextPos.y += 1; break;
        }

        if (nextPos.x < 0 || nextPos.x >= 80 || nextPos.y < 0 || nextPos.y >= 50 ||
            isPositionOccupied(nextPos.x, nextPos.y)) {
            nextPos = currentPos;
        }
    }

    gameState.poisonFood = nextPos;

    // More frequent direction changes for poison food (20% chance)
    if (Math.random() < 0.2) {
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        gameState.poisonFoodDirection = directions[Math.floor(Math.random() * 4)];
    }
}

function startNewSession() {
    console.log('Starting new 5-minute session');

    // Reset game state
    gameState.sessionStartTime = Date.now();
    gameState.gameEnded = false;

    // Reset all players
    for (let [id, player] of gameState.players) {
        const spawnPos = getRandomSpawnPosition();
        player.snake = [
            { x: spawnPos.x, y: spawnPos.y },
            { x: spawnPos.x - 1, y: spawnPos.y },
            { x: spawnPos.x - 2, y: spawnPos.y }
        ];
        player.direction = 'RIGHT';
        player.score = 0;
        player.alive = true;
    }

    // Respawn food
    spawnFood('staticFood');
    spawnFood('tempFood');
    spawnFood('movingFood');
    spawnFood('weaponFood');
    spawnFood('armorFood');

    // Clear poison food timer and don't spawn poison food at session start
    if (gameState.poisonFoodTimer) {
        clearTimeout(gameState.poisonFoodTimer);
        gameState.poisonFoodTimer = null;
    }
    gameState.poisonFood = { x: undefined, y: undefined };

    // Clear all projectiles
    gameState.projectiles = [];

    io.emit('newSessionStarted', {
        sessionDuration: gameState.sessionDuration
    });
}

// Socket connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Check if game is full
    if (gameState.players.size >= gameState.maxPlayers) {
        socket.emit('gameFull');
        socket.disconnect();
        return;
    }

    // Create new player
    const spawnPos = getRandomSpawnPosition();
    const playerIndex = gameState.players.size;
    const player = {
        id: socket.id,
        name: `Player ${playerIndex + 1}`,
        snake: [
            { x: spawnPos.x, y: spawnPos.y },
            { x: spawnPos.x - 1, y: spawnPos.y },
            { x: spawnPos.x - 2, y: spawnPos.y }
        ],
        direction: 'RIGHT',
        color: playerColors[playerIndex % playerColors.length],
        score: 0,
        alive: true,
        shots: 0,
        armor: 0,
        armored: false
    };

    gameState.players.set(socket.id, player);

    // Send initial game state to new player
    const timeRemaining = Math.max(0, gameState.sessionDuration - (Date.now() - gameState.sessionStartTime));
    socket.emit('gameState', {
        players: Array.from(gameState.players.values()),
        staticFood: gameState.staticFood,
        tempFood: gameState.tempFood,
        movingFood: gameState.movingFood,
        weaponFood: gameState.weaponFood,
        armorFood: gameState.armorFood,
        poisonFood: gameState.poisonFood,
        projectiles: gameState.projectiles,
        playerId: socket.id,
        timeRemaining: timeRemaining,
        gameEnded: gameState.gameEnded
    });

    // Notify all players of new player
    socket.broadcast.emit('playerJoined', player);

    // Handle player input
    socket.on('move', (direction) => {
        const player = gameState.players.get(socket.id);
        if (player && player.alive) {
            // Prevent reverse direction
            const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
            if (direction !== opposites[player.direction]) {
                player.direction = direction;
            }
        }
    });

    // Handle player respawn request
    socket.on('respawn', () => {
        const player = gameState.players.get(socket.id);
        if (player && !player.alive && !gameState.gameEnded) {
            const spawnPos = getRandomSpawnPosition();
            player.snake = [
                { x: spawnPos.x, y: spawnPos.y },
                { x: spawnPos.x - 1, y: spawnPos.y },
                { x: spawnPos.x - 2, y: spawnPos.y }
            ];
            player.direction = 'RIGHT';
            player.alive = true;
            // Keep the score and shots from previous life

            io.emit('playerRespawned', player);
            console.log(`Player ${player.name} respawned with ${player.score} points`);
        }
    });

    // Handle shooting
    socket.on('shoot', () => {
        const player = gameState.players.get(socket.id);
        if (player && player.alive && player.shots > 0 && player.score >= 5 && !gameState.gameEnded) {
            const head = player.snake[0];
            const projectile = {
                id: Date.now() + Math.random(),
                x: head.x,
                y: head.y,
                direction: player.direction, // Shoot in current movement direction
                playerId: socket.id,
                playerName: player.name
            };

            gameState.projectiles.push(projectile);
            player.shots--;
            player.score = Math.max(0, player.score - 5); // Lose 5 points for shooting

            io.emit('projectileFired', {
                projectile: projectile,
                playerShots: player.shots,
                playerScore: player.score
            });

            console.log(`${player.name} fired a shot ahead! Shots remaining: ${player.shots}, Score: ${player.score}`);
        }
    });

    // Handle armor activation
    socket.on('activateArmor', () => {
        const player = gameState.players.get(socket.id);
        if (player && player.alive && player.armor > 0 && player.score >= 5 && !player.armored && !gameState.gameEnded) {
            player.armor--;
            player.armored = true;
            player.score = Math.max(0, player.score - 5); // Lose 5 points for activating armor

            // Armor lasts for 10 seconds
            setTimeout(() => {
                if (gameState.players.has(socket.id)) {
                    const p = gameState.players.get(socket.id);
                    p.armored = false;
                    io.emit('armorExpired', { playerId: socket.id });
                }
            }, 10000);

            io.emit('armorActivated', {
                playerId: socket.id,
                playerArmor: player.armor,
                playerScore: player.score
            });

            console.log(`${player.name} activated armor! Armor remaining: ${player.armor}, Score: ${player.score}`);
        }
    });

    // Handle player disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        gameState.players.delete(socket.id);
        io.emit('playerLeft', socket.id);
    });
});

// Game loop
setInterval(() => {
    if (gameState.players.size === 0) return;

    // Check if 5-minute session has ended
    const timeRemaining = Math.max(0, gameState.sessionDuration - (Date.now() - gameState.sessionStartTime));

    if (timeRemaining <= 0 && !gameState.gameEnded) {
        gameState.gameEnded = true;

        // Find the winner (highest score)
        const allPlayers = Array.from(gameState.players.values());
        const winner = allPlayers.reduce((prev, current) =>
            (prev.score > current.score) ? prev : current
        );

        io.emit('sessionEnded', {
            winner: winner,
            finalScores: allPlayers.sort((a, b) => b.score - a.score)
        });

        // Start new session after 10 seconds
        setTimeout(() => {
            startNewSession();
        }, 10000);

        return;
    }

    if (gameState.gameEnded) return;

    // Move all players
    for (let [id, player] of gameState.players) {
        if (!player.alive) continue;

        const head = { ...player.snake[0] };

        switch (player.direction) {
            case 'LEFT': head.x -= 1; break;
            case 'RIGHT': head.x += 1; break;
            case 'UP': head.y -= 1; break;
            case 'DOWN': head.y += 1; break;
        }

        player.snake.unshift(head);

        // Check food collision
        let ateFood = false;

        if (head.x === gameState.staticFood.x && head.y === gameState.staticFood.y) {
            player.score += 10;
            spawnFood('staticFood');
            ateFood = true;
        } else if (head.x === gameState.tempFood.x && head.y === gameState.tempFood.y) {
            player.score += 15;
            spawnFood('tempFood');
            ateFood = true;
        } else if (head.x === gameState.movingFood.x && head.y === gameState.movingFood.y) {
            player.score += 25;
            spawnFood('movingFood');
            ateFood = true;
        } else if (head.x === gameState.weaponFood.x && head.y === gameState.weaponFood.y) {
            player.score += 5;
            player.shots += 1; // Give 1 shot
            spawnFood('weaponFood');
            ateFood = true;
            io.emit('playerGotWeapon', { playerId: id, shots: player.shots });
        } else if (head.x === gameState.armorFood.x && head.y === gameState.armorFood.y) {
            player.score += 5;
            player.armor += 1; // Give 1 armor
            spawnFood('armorFood');
            ateFood = true;
            io.emit('playerGotArmor', { playerId: id, armor: player.armor });
        } else if (head.x === gameState.poisonFood.x && head.y === gameState.poisonFood.y) {
            // Poison food kills instantly - no armor protection!
            player.alive = false;
            player.armored = false; // Remove armor if they had it

            // Remove poison food when eaten (clear timer and position)
            if (gameState.poisonFoodTimer) {
                clearTimeout(gameState.poisonFoodTimer);
                gameState.poisonFoodTimer = null;
            }
            gameState.poisonFood = { x: undefined, y: undefined };

            io.emit('playerPoisoned', { playerId: id, playerName: player.name });
            io.emit('poisonFoodExpired'); // Tell clients poison food is gone
            console.log(`${player.name} ate poison food and died!`);
            // Don't set ateFood = true because the player dies
        }

        if (!ateFood) {
            player.snake.pop();
        }

        // Check collisions
        const hitWall = head.x < 0 || head.x >= 80 || head.y < 0 || head.y >= 50;
        const hitSelf = player.snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);

        if (hitWall || hitSelf) {
            if (player.armored) {
                // Armor protects from wall and self collision - just disable armor
                player.armored = false;
                io.emit('armorUsed', { playerId: id });
            } else {
                player.alive = false;
                io.emit('playerDied', id);
            }
        }
    }

    // Check player vs player collisions (bigger snake wins)
    for (let [id1, player1] of gameState.players) {
        if (!player1.alive) continue;

        const head1 = player1.snake[0];

        for (let [id2, player2] of gameState.players) {
            if (id1 === id2 || !player2.alive) continue;

            // Check if player1's head hits player2's body
            const hitPlayer2Body = player2.snake.some(segment =>
                segment.x === head1.x && segment.y === head1.y
            );

            if (hitPlayer2Body) {
                // Compare snake lengths - longer snake wins
                if (player1.snake.length > player2.snake.length) {
                    // Player1 (bigger) kills player2 (smaller)
                    player2.alive = false;
                    player1.score += Math.floor(player2.snake.length * 2); // Bonus points for kill
                    io.emit('playerKilled', {
                        killerId: id1,
                        victimId: id2,
                        killerScore: player1.score
                    });
                } else if (player1.snake.length < player2.snake.length) {
                    // Player2 (bigger) kills player1 (smaller)
                    player1.alive = false;
                    player2.score += Math.floor(player1.snake.length * 2); // Bonus points for kill
                    io.emit('playerKilled', {
                        killerId: id2,
                        victimId: id1,
                        killerScore: player2.score
                    });
                } else {
                    // Same length - both die
                    player1.alive = false;
                    player2.alive = false;
                    io.emit('playerDied', id1);
                    io.emit('playerDied', id2);
                }
            }
        }
    }

    // Check head-to-head collisions
    const alivePlayers = Array.from(gameState.players.values()).filter(p => p.alive);
    for (let i = 0; i < alivePlayers.length; i++) {
        for (let j = i + 1; j < alivePlayers.length; j++) {
            const player1 = alivePlayers[i];
            const player2 = alivePlayers[j];

            const head1 = player1.snake[0];
            const head2 = player2.snake[0];

            // Head-to-head collision
            if (head1.x === head2.x && head1.y === head2.y) {
                if (player1.snake.length > player2.snake.length) {
                    // Player1 wins
                    player2.alive = false;
                    player1.score += Math.floor(player2.snake.length * 2);
                    io.emit('playerKilled', {
                        killerId: player1.id,
                        victimId: player2.id,
                        killerScore: player1.score
                    });
                } else if (player2.snake.length > player1.snake.length) {
                    // Player2 wins
                    player1.alive = false;
                    player2.score += Math.floor(player1.snake.length * 2);
                    io.emit('playerKilled', {
                        killerId: player2.id,
                        victimId: player1.id,
                        killerScore: player2.score
                    });
                } else {
                    // Same length - both die
                    player1.alive = false;
                    player2.alive = false;
                    io.emit('playerDied', player1.id);
                    io.emit('playerDied', player2.id);
                }
            }
        }
    }

    // Move projectiles (faster than snakes - move 2 cells per tick)
    gameState.projectiles = gameState.projectiles.filter(projectile => {
        // Move projectile 2 cells per tick to make it faster than snakes
        const speed = 2;
        switch (projectile.direction) {
            case 'LEFT': projectile.x -= speed; break;
            case 'RIGHT': projectile.x += speed; break;
            case 'UP': projectile.y -= speed; break;
            case 'DOWN': projectile.y += speed; break;
        }

        // Check if projectile hit wall
        if (projectile.x < 0 || projectile.x >= 80 || projectile.y < 0 || projectile.y >= 50) {
            return false; // Remove projectile
        }

        // Check if projectile hit any player
        for (let [playerId, player] of gameState.players) {
            if (!player.alive || playerId === projectile.playerId) continue;

            const hitPlayer = player.snake.some(segment =>
                segment.x === projectile.x && segment.y === projectile.y
            );

            if (hitPlayer) {
                if (player.armored) {
                    // Armor protects from projectiles - just disable armor
                    player.armored = false;
                    io.emit('armorUsed', { playerId: playerId });
                    console.log(`${player.name}'s armor blocked ${projectile.playerName}'s shot!`);
                } else {
                    // Player got shot - they die
                    player.alive = false;

                    // Shooter gets bonus points
                    const shooter = gameState.players.get(projectile.playerId);
                    if (shooter) {
                        shooter.score += 20; // Bonus for successful shot
                    }

                    io.emit('playerShot', {
                        victimId: playerId,
                        shooterId: projectile.playerId,
                        shooterName: projectile.playerName,
                        shooterScore: shooter ? shooter.score : 0
                    });

                    console.log(`${projectile.playerName} shot ${player.name}!`);
                }
                return false; // Remove projectile
            }
        }

        return true; // Keep projectile
    });

    // Move moving food
    moveMovingFood();

    // Move poison food
    movePoisonFood();

    // Send game state to all players
    io.emit('gameUpdate', {
        players: Array.from(gameState.players.values()),
        movingFood: gameState.movingFood,
        poisonFood: gameState.poisonFood,
        projectiles: gameState.projectiles,
        timeRemaining: timeRemaining
    });
}, 150); // Game speed

// Temporary food timer
setInterval(() => {
    spawnFood('tempFood');
}, 5000);

// Weapon food timer (spawns every 15 seconds)
setInterval(() => {
    spawnFood('weaponFood');
}, 15000);

// Armor food timer (spawns every 20 seconds)
setInterval(() => {
    spawnFood('armorFood');
}, 20000);

// Poison food timer (spawns every 30 seconds, lasts 20 seconds)
setInterval(() => {
    // Only spawn if no poison food currently exists
    if (!gameState.poisonFood.x && gameState.poisonFood.x !== 0) {
        spawnPoisonFood();
    }
}, 30000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to play`);
});