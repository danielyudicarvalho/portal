var game;

var ballDistance = 120;
var rotationSpeed = 4;
var angleRange = [25, 155];
var visibleTargets = 7;
var bgColors = [0x62bd18, 0xffbb00, 0xff5300, 0xd21034, 0xff475c, 0x8f16b2];

// Game scoring system
var gameScore = 0;
var gameStartTime = null;
var targetsHit = 0;
var perfectHits = 0;
var totalAttempts = 0;
var currentStreak = 0;
var maxStreak = 0;


window.onload = function () {
  game = new Phaser.Game(640, 960, Phaser.AUTO, "");
  game.state.add("PlayGame", playGame);
  game.state.start("PlayGame");
}

var playGame = function (game) {};

playGame.prototype = {
  preload: function () {
    game.load.image("ball", "assets/ball.png");
    game.load.image("target", "assets/target.png");
    game.load.image("arm", "assets/arm.png");
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  },
  create: function () {
    this.savedData = localStorage.getItem("circlepath") == null ? {
      score: 0
    } : JSON.parse(localStorage.getItem("circlepath"));
    
    // Initialize game scoring (always reset for new game)
    gameStartTime = Date.now();
    gameScore = 0;
    targetsHit = 0;
    perfectHits = 0;
    totalAttempts = 0;
    currentStreak = 0;
    maxStreak = 0;
    
    console.log('Circle Path: Game initialized, scoring reset');
    
    // Send initial game state to parent window
    this.sendGameStateUpdate();
    
    var style = {
      font: "bold 64px Arial",
      fill: "#ffffff"
    };
    var text = game.add.text(0, game.height - 64, "Best score: " + this.savedData.score.toString(), style);
    this.destroy = false;
    this.saveRotationSpeed = rotationSpeed;
    this.tintColor = bgColors[game.rnd.between(0, bgColors.length - 1)];
    do {
      this.tintColor2 = bgColors[game.rnd.between(0, bgColors.length - 1)];
    } while (this.tintColor == this.tintColor2)
    game.stage.backgroundColor = this.tintColor;
    this.targetArray = [];
    this.steps = 0;
    this.rotatingDirection = game.rnd.between(0, 1);
    this.gameGroup = game.add.group();
    this.targetGroup = game.add.group();
    this.ballGroup = game.add.group();
    this.gameGroup.add(this.targetGroup);
    this.gameGroup.add(this.ballGroup);
    this.arm = game.add.sprite(game.width / 2, game.height / 4 * 2.7, "arm");
    this.arm.anchor.set(0, 0.5);
    this.arm.tint = this.tintColor2;
    this.ballGroup.add(this.arm);
    this.balls = [
      game.add.sprite(game.width / 2, game.height / 4 * 2.7, "ball"),
      game.add.sprite(game.width / 2, game.height / 2, "ball")
    ]
    this.balls[0].anchor.set(0.5);
    this.balls[0].tint = this.tintColor2;
    this.balls[1].anchor.set(0.5);
    this.balls[1].tint = this.tintColor2;
    this.ballGroup.add(this.balls[0]);
    this.ballGroup.add(this.balls[1]);
    this.rotationAngle = 0;
    this.rotatingBall = 1;
    var target = game.add.sprite(0, 0, "target");
    target.anchor.set(0.5);
    target.x = this.balls[0].x;
    target.y = this.balls[0].y;
    this.targetGroup.add(target);
    this.targetArray.push(target);
    game.input.onDown.add(this.changeBall, this);
    for (var i = 0; i < visibleTargets; i++) {
      this.addTarget();
    }

  },
  update: function () {
    var distanceFromTarget = this.balls[this.rotatingBall].position.distance(this.targetArray[1].position);
    if (distanceFromTarget > 90 && this.destroy && this.steps > visibleTargets) {
      this.gameOver();
    }
    if (distanceFromTarget < 40 && !this.destroy) {
      this.destroy = true;
    }
    this.rotationAngle = (this.rotationAngle + this.saveRotationSpeed * (this.rotatingDirection * 2 - 1)) % 360;
    this.arm.angle = this.rotationAngle + 90;
    this.balls[this.rotatingBall].x = this.balls[1 - this.rotatingBall].x - ballDistance * Math.sin(Phaser.Math.degToRad(this.rotationAngle));
    this.balls[this.rotatingBall].y = this.balls[1 - this.rotatingBall].y + ballDistance * Math.cos(Phaser.Math.degToRad(this.rotationAngle));
    var distanceX = this.balls[1 - this.rotatingBall].worldPosition.x - game.width / 2;
    var distanceY = this.balls[1 - this.rotatingBall].worldPosition.y - game.height / 4 * 2.7;
    this.gameGroup.x = Phaser.Math.linearInterpolation([this.gameGroup.x, this.gameGroup.x - distanceX], 0.05);
    this.gameGroup.y = Phaser.Math.linearInterpolation([this.gameGroup.y, this.gameGroup.y - distanceY], 0.05);
  },
  changeBall: function () {
    this.destroy = false;
    var distanceFromTarget = this.balls[this.rotatingBall].position.distance(this.targetArray[1].position);
    totalAttempts++;
    
    console.log('Circle Path: Ball changed, distance:', distanceFromTarget);
    
    if (distanceFromTarget < 20) {
      // Successful hit
      targetsHit++;
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
      
      // Calculate score based on accuracy
      var hitScore = this.calculateHitScore(distanceFromTarget);
      gameScore += hitScore;
      
      console.log('Circle Path: Hit! Score:', hitScore, 'Total:', gameScore, 'Targets:', targetsHit);
      
      // Check for perfect hit (very close to center)
      if (distanceFromTarget < 10) {
        perfectHits++;
        gameScore += 50; // Perfect hit bonus
        console.log('Circle Path: Perfect hit bonus! Total score:', gameScore);
      }
      
      // Send updated game state
      this.sendGameStateUpdate();
      
      this.rotatingDirection = game.rnd.between(0, 1);
      var detroyTween = game.add.tween(this.targetArray[0]).to({
        alpha: 0
      }, 500, Phaser.Easing.Cubic.In, true);
      detroyTween.onComplete.add(function (e) {
        e.destroy();
      })
      this.targetArray.shift();
      this.arm.position = this.balls[this.rotatingBall].position;
      this.rotatingBall = 1 - this.rotatingBall;
      this.rotationAngle = this.balls[1 - this.rotatingBall].position.angle(this.balls[this.rotatingBall].position, true) - 90;
      this.arm.angle = this.rotationAngle + 90;
      for (var i = 0; i < this.targetArray.length; i++) {
        this.targetArray[i].alpha += 1 / 7;
      }
      this.addTarget();
    } else {
      // Missed target - reset streak
      currentStreak = 0;
      this.gameOver();
    }
  },
  addTarget: function () {
    this.steps++;
    startX = this.targetArray[this.targetArray.length - 1].x;
    startY = this.targetArray[this.targetArray.length - 1].y;
    var target = game.add.sprite(0, 0, "target");
    var randomAngle = game.rnd.between(angleRange[0] + 90, angleRange[1] + 90);
    target.anchor.set(0.5);
    target.x = startX + ballDistance * Math.sin(Phaser.Math.degToRad(randomAngle));
    target.y = startY + ballDistance * Math.cos(Phaser.Math.degToRad(randomAngle));
    target.alpha = 1 - this.targetArray.length * (1 / 7);
    var style = {
      font: "bold 32px Arial",
      fill: "#" + this.tintColor.toString(16),
      align: "center"
    };
    var text = game.add.text(0, 0, this.steps.toString(), style);
    text.anchor.set(0.5);
    target.addChild(text);
    this.targetGroup.add(target);
    this.targetArray.push(target);
  },
  sendGameStateUpdate: function() {
    var gameStateData = {
      score: gameScore,
      level: targetsHit + 1,
      multiplier: Math.min(Math.floor(currentStreak / 5) + 1, 5), // Max 5x multiplier
      isPlaying: true,
      gameStartTime: gameStartTime
    };
    
    console.log('Circle Path: Sending game state update:', gameStateData);
    
    // Send current game state to parent window for score display
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'CIRCLE_PATH_STATE',
        gameState: gameStateData
      }, '*');
    } else {
      console.log('Circle Path: No parent window found, running standalone');
    }
  },
  
  calculateHitScore: function(distance) {
    // Base score for hitting target
    var baseScore = 100;
    
    // Distance bonus (closer = more points)
    var distanceBonus = Math.max(0, Math.floor((20 - distance) * 5));
    
    // Streak multiplier
    var streakMultiplier = Math.min(Math.floor(currentStreak / 5) + 1, 5);
    
    // Target number bonus (later targets worth more)
    var targetBonus = Math.floor(targetsHit / 10) * 10;
    
    return (baseScore + distanceBonus + targetBonus) * streakMultiplier;
  },
  
  gameOver: function () {
    var duration = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // Calculate final score with bonuses
    var streakBonus = maxStreak * 25;
    var accuracyBonus = Math.floor((perfectHits / Math.max(totalAttempts, 1)) * 1000);
    var survivalBonus = targetsHit * 10;
    var finalScore = gameScore + streakBonus + accuracyBonus + survivalBonus;
    
    console.log('Circle Path: Game Over!');
    console.log('Circle Path: Base Score:', gameScore);
    console.log('Circle Path: Streak Bonus:', streakBonus, '(max streak:', maxStreak + ')');
    console.log('Circle Path: Accuracy Bonus:', accuracyBonus, '(perfect hits:', perfectHits, '/', totalAttempts + ')');
    console.log('Circle Path: Survival Bonus:', survivalBonus, '(targets hit:', targetsHit + ')');
    console.log('Circle Path: Final Score:', finalScore);
    console.log('Circle Path: Duration:', duration, 'seconds');
    
    // Send final game state
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'CIRCLE_PATH_STATE',
        gameState: {
          score: finalScore,
          level: targetsHit,
          multiplier: 1,
          isPlaying: false,
          gameStartTime: gameStartTime
        }
      }, '*');
    }
    
    // Submit score to API
    this.submitScore(finalScore, targetsHit, duration);
    
    localStorage.setItem("circlepath", JSON.stringify({
      score: Math.max(this.savedData.score, finalScore)
    }));
    game.input.onDown.remove(this.changeBall, this);
    this.saveRotationSpeed = 0;
    this.arm.destroy();
    var gameOverTween = game.add.tween(this.balls[1 - this.rotatingBall]).to({
      alpha: 0
    }, 1000, Phaser.Easing.Cubic.Out, true);
    gameOverTween.onComplete.add(function () {
      game.state.start("PlayGame");
    }, this)
  },
  
  submitScore: function(score, level, duration) {
    var gameData = {
      score: score,
      level: level,
      duration: duration,
      metadata: {
        targetsHit: targetsHit,
        perfectHits: perfectHits,
        totalAttempts: totalAttempts,
        maxStreak: maxStreak,
        accuracy: Math.round((targetsHit / Math.max(totalAttempts, 1)) * 100)
      }
    };
    
    fetch('/api/games/circle-path/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score submitted successfully:', data);
    })
    .catch(error => {
      console.error('Error submitting score:', error);
    });
  }
}