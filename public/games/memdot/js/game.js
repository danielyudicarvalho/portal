// the game
var game;

// size of each tile, in pixels
var gridSize = 40;

// colors to be used in game
var colorsInGame = [0xff0000, 0xff8800, 0x00ff00, 0x0000ff, 0xff00ff, 0x555555];

// how many circles in game?
var circlesInGame = 4;

// Game scoring system
var gameScore = 0;
var currentLevel = 1;
var gameStartTime = null;
var levelStartTime = null;
var scoreMultiplier = 1;

// creation of the game
window.onload = function () {
  console.log('Memdot game initializing...');
  try {
    game = new Phaser.Game(320, 480, Phaser.AUTO, "game-container");
    game.state.add("PlayGame", playGame);
    game.state.start("PlayGame");
    console.log('Memdot game started successfully');
  } catch (error) {
    console.error('Error initializing memdot game:', error);
  }
}


var playGame = function (game) {}

playGame.prototype = {
  preload: function () {
    console.log('Memdot preloading assets...');
    
    // Add error handling for asset loading
    game.load.onFileError.add(function(key, file) {
      console.error('Failed to load asset:', key, file);
    });
    
    game.load.onLoadComplete.add(function() {
      console.log('All memdot assets loaded successfully');
    });

    // preloading the assets
    game.load.spritesheet("circles", "assets/circles.png", gridSize, gridSize);
    game.load.spritesheet("timer", "assets/timer.png", 16, 16);
    game.load.image("background", "assets/background.png");
  },
  create: function () {
    console.log('Memdot create function called');

    // game won't pause if focus il lost
    game.stage.disableVisibilityChange = true;

    // checking if it's game over
    this.gameOver = false;

    // Initialize game scoring
    gameScore = 0;
    currentLevel = 1;
    gameStartTime = Date.now();
    levelStartTime = Date.now();
    scoreMultiplier = 1;

    // Send initial game state
    this.sendGameStateUpdate();

    // set background color to white                                                                                     
    game.stage.backgroundColor = "#ffffff";

    // adding a group containing all circles
    this.circleGroup = game.add.group();

    // Create UI elements
    this.createUI();

    // placeCirlces method will handle circle placement and movement
    this.handleCircles();

    // filling the entire canvas with a tile sprite
    this.cover = game.add.tileSprite(0, 0, game.width, game.height, "background");

    // setting the cover to tansparent
    this.cover.alpha = 0;

    // adding a group containing all timers
    this.timerGroup = game.add.group();

    // adding 10 circle timers to timerGroup group
    for (var i = 0; i < 10; i++) {
      var timeCircle = game.add.sprite(i * 20, game.height - 20, "timer");
      this.timerGroup.add(timeCircle);
    }

    // horizontal centering timerGroup
    this.timerGroup.x = (game.width - this.timerGroup.width) / 2;
  },

  // Create UI elements for score and level display
  createUI: function() {
    // Score text
    this.scoreText = game.add.text(10, 10, 'Score: 0', {
      font: '16px Arial',
      fill: '#333333',
      fontWeight: 'bold'
    });

    // Level text
    this.levelText = game.add.text(10, 30, 'Level: 1', {
      font: '16px Arial',
      fill: '#333333',
      fontWeight: 'bold'
    });

    // Multiplier text
    this.multiplierText = game.add.text(10, 50, 'x1', {
      font: '14px Arial',
      fill: '#666666'
    });
  },

  // Update UI elements
  updateUI: function() {
    if (this.scoreText) {
      this.scoreText.text = 'Score: ' + gameScore;
    }
    if (this.levelText) {
      this.levelText.text = 'Level: ' + currentLevel;
    }
    if (this.multiplierText) {
      this.multiplierText.text = 'x' + scoreMultiplier;
    }
    
    // Send game state to parent window for real-time display
    this.sendGameStateUpdate();
  },

  // Send game state updates to parent window
  sendGameStateUpdate: function() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'GAME_STATE_UPDATE',
        gameState: {
          score: gameScore,
          level: currentLevel,
          multiplier: scoreMultiplier,
          isPlaying: !this.gameOver,
          gameStartTime: gameStartTime
        }
      }, window.location.origin);
    }
  },

  // function to place the circles on the stage
  handleCircles: function () {

    // removing old circles, if any
    this.removeOldCircles();

    // adding new circles to the game
    this.addNewCircles();

    // after two seconds, let's cover the screen
    game.time.events.add(Phaser.Timer.SECOND * 2, this.fadeOut, this);
  },

  // function to remove circles from the stage
  removeOldCircles: function () {

    // handlong circles already in game, if any
    this.circleGroup.forEach(function (item) {

      // set remaining circles back to their colors and frames                   
      item.tint = item.tintColor;
      item.frame = 0;

      // choosimg a random direction: 1 = left, 2 = up, 3 = right, 4 = down
      var randomDirection = game.rnd.integerInRange(1, 4);

      // a temporary object which will be used to handle circle tween
      var tweenObject = {};

      // according to random direction...
      switch (randomDirection) {
        case 1:

          // left: circle will leave the stage to the left
          tweenObject.x = -gridSize;
          break;
        case 2:

          // up: circle will leave the stage to the top
          tweenObject.y = -gridSize;
          break;
        case 3:

          // right: circle will leave the stage to the right
          tweenObject.x = game.width + gridSize;
          break;
        case 4:

          // down: circle will leave the stage to the bottom
          tweenObject.y = game.height + gridSize;
          break;
      }

      // moving the circle to its new position
      var removeTween = game.add.tween(item).to(tweenObject, 500, Phaser.Easing.Cubic.In, true);

      removeTween.onComplete.add(function (item) {
        item.destroy();
      }, this)

    }, this);
  },

  // function to add new circles
  addNewCircles: function () {

    // possibleColors will contain the same items as colorsInGame array,
    // just repeated (circlesInGame - 1) times.
    // we want to have more circles with the same color, but not ALL circle with the same color
    this.possibleColors = [];
    this.possibleColors.lenght = 0;
    for (var i = 0; i < colorsInGame.length; i++) {
      for (var j = 0; j < circlesInGame - 1; j++) {
        this.possibleColors.push(colorsInGame[i])
      }
    }

    // boardWidth and boardHeight will determine the width and height of the game board,
    // according to game size and grid size.
    // we subtract 2 from both boardWidth and boardHeight because we don't want
    // tiles to be at the very edge of the canvas
    var boardWidth = game.width / gridSize - 2;
    var boardHeight = game.height / gridSize - 2;

    // creation of an array with all possible grid positions
    this.positionsArray = [];
    this.positionsArray.length = 0;
    for (var i = 0; i < (boardWidth) * (boardHeight); i++) {
      this.positionsArray.push(i);
    }

    // pickedColors is the array which will contain all colors actually used in this game
    this.pickedColors = [];
    this.pickedColors.length = 0;

    // repeating this loop circlesInGame times
    for (var i = 0; i < circlesInGame; i++) {

      // choosing a random position for the circle.
      // this position won't be available anymore as we remove it from positionsArray 
      var randomPosition = Phaser.ArrayUtils.removeRandomItem(this.positionsArray);

      // determining circle x and y position in pixels
      var posX = (1 + randomPosition % (boardWidth)) * gridSize;
      var posY = (1 + Math.floor(randomPosition / boardWidth)) * gridSize;

      // creating the circle as a button which calls circleSelected function
      var circle = game.add.button(posX, posY, "circles", this.circleSelected, this);

      // adding the circle to circleGroup group 
      this.circleGroup.add(circle);

      // tinting the circle with a possible color and removing the color
      // from the array of possible colors.
      // we also save its tint color in a property called tintColor
      circle.tintColor = Phaser.ArrayUtils.removeRandomItem(this.possibleColors)
      circle.tint = circle.tintColor;

      // adding the tint color to pickedColors array, if not already in the array
      if (this.pickedColors.indexOf(circle.tint) == -1) {
        this.pickedColors.push(circle.tint);
      }

      // choosimg a random direction: 1 = left, 2 = up, 3 = right, 4 = down
      var randomDirection = game.rnd.integerInRange(1, 4);

      // a temporary object which will be used to handle circle tween
      var tweenObject = {};

      // according to random direction...
      switch (randomDirection) {
        case 1:

          // left: circle is placed just outside left border and the tween
          // will bring it to its initial x position
          circle.x = -gridSize;
          tweenObject.x = posX;
          break;
        case 2:

          // up: circle is placed just outside upper border and the tween
          // will bring it to its initial y position
          circle.y = -gridSize;
          tweenObject.y = posY;
          break;
        case 3:

          // right: circle is placed just outside right border and the tween
          // will bring it to its initial x position
          circle.x = game.width + gridSize;
          tweenObject.x = posX;
          break;
        case 4:

          // down: circle is placed just outside bottom border and the tween
          // will bring it to its initial y position
          circle.y = game.height + gridSize;
          tweenObject.y = posY;
          break;
      }

      // adding the tween to circle. This will create the "enter in the stage" effect
      game.add.tween(circle).to(tweenObject, 500, Phaser.Easing.Cubic.Out, true);
    }
  },

  // this function will cover the screen with a random color
  fadeOut: function () {

    // this variable will count the ticks
    this.timePassed = 1;

    // setting all time circles to frame zero
    this.timerGroup.forEach(function (item) {
      item.frame = 0;
    }, this)

    // giving the cover a tint color picked among circle colors 
    this.cover.tint = Phaser.ArrayUtils.getRandomItem(this.pickedColors);

    // tweening the cover to fully opaque
    var coverTween = game.add.tween(this.cover).to({
      alpha: 1
    }, 200, Phaser.Easing.Linear.None, true);

    // once the cover is fully opaque...
    coverTween.onComplete.add(function () {

      // bring to top circleGroup as it was hidden by the cover
      game.world.bringToTop(this.circleGroup);

      // for each circle in circleGroup group...
      this.circleGroup.forEach(function (item) {

        // tinting it white
        item.tint = 0xffffff;

        // setting it to frame 1 to show just a white ring
        item.frame = 1;
      }, this);

      // startig the countdown
      this.countDown = game.time.events.repeat(Phaser.Timer.SECOND / 5, 11, this.tick, this);

    }, this)
  },

  // this function will be called each time a circle is touched
  // b is the circle
  circleSelected: function (b) {

    // if the screen is already fully covered...
    if (!this.gameOver && this.cover.alpha == 1) {

      // if the circle has the same tint color of the cover...
      // (we use tintColor property we previously saved, because circle tint color now is white)
      if (b.tintColor == this.cover.tint) {
        // Add points for correct selection
        var basePoints = 50;
        var timeBonus = Math.max(0, Math.floor((10 - this.timePassed) * 5));
        gameScore += (basePoints + timeBonus) * scoreMultiplier;
        this.updateUI();

        // then destroy it
        b.destroy();

        // checking if the level is completed, that is there aren't circles with
        // cover color still on the stage
        var levelCompleted = true;
        this.circleGroup.forEach(function (item) {
          if (item.tintColor == this.cover.tint) {
            levelCompleted = false;
          }
        }, this);

        // if level is completed, advance to next level
        if (levelCompleted) {
          // Calculate level completion bonus
          var levelTime = (Date.now() - levelStartTime) / 1000;
          var timeBonus = Math.max(0, Math.floor((10 - levelTime) * 10));
          var levelBonus = currentLevel * 100;
          
          gameScore += (timeBonus + levelBonus) * scoreMultiplier;
          
          // Increase level and difficulty
          currentLevel++;
          if (currentLevel % 3 === 0) {
            circlesInGame = Math.min(circlesInGame + 1, 8);
            scoreMultiplier++;
          }
          
          levelStartTime = Date.now();
          this.updateUI();

          // stop the timer
          game.time.events.remove(this.countDown);

          // turning the cover invisible
          this.cover.alpha = 0;

          // placing new circles
          this.handleCircles();
        }
      } else {

        // if not, show the actual color of the circle
        b.tint = b.tintColor
        b.frame = 0;

        // then stop the timer
        game.time.events.remove(this.countDown);

        // and it's game over
        this.gameOver = true;

        // Send final game state update
        this.sendGameStateUpdate();

        // Submit score to server
        this.submitScore();

        // wait 5 seconds then restart the game
        game.time.events.add(Phaser.Timer.SECOND * 5, function () {
          game.state.start("PlayGame");
        }, this);
      }
    }
  },

  // function to be executed by countDown timer event
  tick: function (e) {

    // if timePassed is less or equal to 10, that is if there still is time left...
    if (this.timePassed <= 10) {

      // turn off a timer circle
      this.timerGroup.getChildAt(10 - this.timePassed).frame = 1;

      // increase time passed
      this.timePassed++;
    }

    // else, it's game over
    else {
      // Time's up - game over
      this.gameOver = true;
      this.sendGameStateUpdate();
      this.submitScore();
      
      // wait 5 seconds then restart the game
      game.time.events.add(Phaser.Timer.SECOND * 5, function () {
        game.state.start("PlayGame");
      }, this);
    }
  },

  // Submit score to the server
  submitScore: function() {
    if (gameScore <= 0) return;
    
    var gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // Create game over display
    this.showGameOver();
    
    // Submit to API
    fetch('/api/games/memdot/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score: gameScore,
        level: currentLevel,
        duration: gameDuration,
        metadata: {
          circlesCompleted: currentLevel - 1,
          finalMultiplier: scoreMultiplier
        }
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Score submitted successfully:', data);
        // Show appropriate message based on user status
        if (this.gameOverText) {
          if (data.anonymous) {
            this.gameOverText.text += '\nSign in to save to leaderboard!';
          } else {
            this.gameOverText.text += '\nScore Saved to Leaderboard!';
          }
        }
      } else {
        console.error('Failed to submit score:', data.error);
      }
    })
    .catch(error => {
      console.error('Error submitting score:', error);
    });
  },

  // Show game over screen
  showGameOver: function() {
    // Create semi-transparent overlay
    var overlay = game.add.graphics(0, 0);
    overlay.beginFill(0x000000, 0.7);
    overlay.drawRect(0, 0, game.width, game.height);
    overlay.endFill();

    // Game over text
    this.gameOverText = game.add.text(game.width / 2, game.height / 2 - 40, 
      'GAME OVER\n\nFinal Score: ' + gameScore + '\nLevel Reached: ' + currentLevel + '\n\nRestarting in 5 seconds...', {
      font: '18px Arial',
      fill: '#ffffff',
      align: 'center',
      fontWeight: 'bold'
    });
    this.gameOverText.anchor.setTo(0.5, 0.5);
  }
}