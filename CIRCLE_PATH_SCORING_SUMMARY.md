# Circle Path - Scoring System Summary

## Game Overview
Circle Path is an arcade-style game where players navigate through circular paths by switching between rotating balls. The game tests reflexes, timing, and precision as players must hit targets at the right moment to survive and score points.

## Scoring Components

### Base Scoring
- **Target Hit**: 100 points per successful target hit
- **Distance Bonus**: Up to 100 points based on accuracy (closer to center = more points)
- **Perfect Hit Bonus**: 50 points for hitting very close to target center (< 10 distance)

### Multipliers and Bonuses
- **Streak Multiplier**: Up to 5x multiplier based on consecutive hits (every 5 hits increases multiplier)
- **Target Progression Bonus**: 10 points per 10 targets hit (increases over time)
- **Survival Bonus**: 10 × total targets hit
- **Max Streak Bonus**: 25 × highest streak achieved
- **Accuracy Bonus**: Up to 1000 points based on perfect hit percentage

### Game Mechanics
- Players tap to switch the rotating ball
- Must hit targets by switching at the right moment
- Missing a target ends the game
- Game tracks accuracy, streaks, and survival time

## Scoring Examples

### Example 1: Perfect Streak Run (50 targets, all perfect)
- Base scores: 50 × 100 = 5,000 points
- Distance bonuses: 50 × 100 = 5,000 points
- Perfect hit bonuses: 50 × 50 = 2,500 points
- Streak multipliers: Applied throughout (average 3x) = ~12,500 additional
- Target progression: 50 × 10 = 500 points
- Survival bonus: 50 × 10 = 500 points
- Max streak bonus: 50 × 25 = 1,250 points
- Accuracy bonus: (50/50) × 1000 = 1,000 points
- **Total: ~28,250 points**

### Example 2: Good Run (30 targets, 20 perfect)
- Base scores: 30 × 100 = 3,000 points
- Distance bonuses: ~2,000 points (mixed accuracy)
- Perfect hit bonuses: 20 × 50 = 1,000 points
- Streak multipliers: Applied (average 2x) = ~6,000 additional
- Target progression: 30 × 10 = 300 points
- Survival bonus: 30 × 10 = 300 points
- Max streak bonus: 25 × 25 = 625 points
- Accuracy bonus: (20/30) × 1000 = 667 points
- **Total: ~13,892 points**

### Example 3: Early Game Over (10 targets, 5 perfect)
- Base scores: 10 × 100 = 1,000 points
- Distance bonuses: ~500 points
- Perfect hit bonuses: 5 × 50 = 250 points
- Streak multipliers: Limited (average 1.5x) = ~750 additional
- Target progression: 10 × 10 = 100 points
- Survival bonus: 10 × 10 = 100 points
- Max streak bonus: 8 × 25 = 200 points
- Accuracy bonus: (5/10) × 1000 = 500 points
- **Total: ~3,400 points**

## Leaderboard Integration
- Scores are submitted to `/api/games/circle-path/scores`
- Leaderboard displays top scores with targets hit and accuracy
- Championship page shows real-time rankings
- Score metadata includes targets hit, perfect hits, max streak, and accuracy

## Technical Implementation
- Game tracks: score, targets hit, perfect hits, streaks, accuracy
- Score submission includes metadata for detailed statistics
- Real-time score updates sent to parent window
- Local storage maintains personal best scores

## Strategy Tips
- **Timing is Key**: Wait for the optimal moment to switch balls
- **Build Streaks**: Consecutive hits multiply your score significantly
- **Aim for Center**: Perfect hits provide substantial bonus points
- **Stay Calm**: Panic switching leads to missed targets and game over
- **Practice Rhythm**: Develop a feel for the rotation timing