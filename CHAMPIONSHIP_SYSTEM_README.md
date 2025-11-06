# Championship System

The Championship System allows players to compete in time-limited tournaments with entry fees and prize pools. Players can create their own championships or join existing ones to compete for the highest scores.

## Features

### 🏆 Championship Events
- **Time-Limited Competitions**: Championships have defined start and end times
- **Entry Fees**: Players pay credits to participate
- **Prize Pools**: Winners receive credits based on their ranking
- **Participant Limits**: Optional maximum number of participants
- **Real-time Leaderboards**: Live score tracking during active championships

### 🎮 Game Integration
- **Multi-Game Support**: Championships can be created for any supported game
- **Score Submission**: Automatic score tracking during championship periods
- **Best Score Tracking**: Only the player's highest score counts
- **Game-Specific Pages**: Dedicated championship pages for each game

### 💰 Credit System Integration
- **Entry Fee Payment**: Automatic credit deduction when joining
- **Prize Distribution**: Automatic prize distribution when championships end
- **Transaction History**: Full audit trail of championship-related transactions

## Database Schema

### Championships Table
```sql
CREATE TABLE "championships" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "gameId" TEXT NOT NULL,
    "entryFee" INTEGER NOT NULL DEFAULT 0,
    "prizePool" INTEGER NOT NULL DEFAULT 0,
    "maxParticipants" INTEGER,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id")
);
```

### Championship Participants Table
```sql
CREATE TABLE "championship_participants" (
    "id" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bestScore" INTEGER DEFAULT 0,
    "bestScoreId" TEXT,
    "finalRank" INTEGER,
    "prizeWon" INTEGER DEFAULT 0,
    PRIMARY KEY ("id")
);
```

## Championship Status Flow

1. **UPCOMING** → Championship is scheduled but hasn't started yet
2. **ACTIVE** → Championship is currently running, players can submit scores
3. **COMPLETED** → Championship has ended, final rankings and prizes determined
4. **CANCELLED** → Championship was cancelled (manual action)

## Prize Distribution

The system automatically distributes prizes when championships end:

- **1 participant**: Winner takes all (100%)
- **2 participants**: 1st place (70%), 2nd place (30%)
- **3+ participants**: 1st place (50%), 2nd place (30%), 3rd place (20%)

## API Endpoints

### Championship Management
- `GET /api/championships` - List championships with filters
- `POST /api/championships` - Create new championship
- `GET /api/championships/[id]` - Get championship details
- `PUT /api/championships/[id]` - Update championship (creator only)

### Participation
- `POST /api/championships/[id]/join` - Join championship
- `POST /api/championships/[id]/submit-score` - Submit score during active championship

### System Management
- `POST /api/championships/update-status` - Update championship statuses (cron job)

## Components

### ChampionshipCard
Displays championship information in a card format with:
- Championship title and description
- Game information
- Entry fee and prize pool
- Participant count and time remaining
- Join/View buttons
- Top participants preview

### CreateChampionshipModal
Modal for creating new championships with:
- Basic information (title, description, game)
- Championship settings (entry fee, participant limit)
- Schedule configuration (start/end times)
- Quick duration buttons
- Form validation

### Championship Detail Page
Full championship view with:
- Championship header and stats
- Live leaderboard
- Game integration for active championships
- Participant management
- Real-time updates

## Game Integration

### Championship-Aware Games
Games can detect when they're being played in championship mode:
- URL parameter: `?championshipId=xxx`
- Score submission to championship API
- Special UI indicators for championship play

### Score Submission
```javascript
// Example score submission during championship
const submitScore = async (championshipId, scoreData) => {
  const response = await fetch(`/api/championships/${championshipId}/submit-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      score: scoreData.score,
      level: scoreData.level,
      duration: scoreData.duration,
      metadata: scoreData.metadata
    })
  });
  return response.json();
};
```

## Background Services

### Championship Status Updates
The system includes a background service that:
- Updates UPCOMING championships to ACTIVE when start time is reached
- Updates ACTIVE championships to COMPLETED when end time is reached
- Calculates final rankings and distributes prizes
- Records all transactions

### Cron Job Setup
Set up a cron job to regularly update championship statuses:
```bash
# Update championship statuses every minute
* * * * * curl -X POST https://your-domain.com/api/championships/update-status \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Usage Examples

### Creating a Championship
```javascript
const championshipData = {
  title: "Memory Master Challenge",
  description: "Test your memory skills!",
  gameId: "memdot-game-id",
  entryFee: 25,
  maxParticipants: 50,
  startTime: "2024-01-15T18:00:00Z",
  endTime: "2024-01-15T22:00:00Z",
  isPublic: true
};

const response = await fetch('/api/championships', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(championshipData)
});
```

### Joining a Championship
```javascript
const response = await fetch(`/api/championships/${championshipId}/join`, {
  method: 'POST'
});
```

## Testing

### Seed Sample Data
```bash
node scripts/seed-championships.js
```

### Test Championship System
```bash
node scripts/test-championships.js
```

### Manual Status Update
```bash
curl -X GET http://localhost:3000/api/championships/update-status
```

## Security Considerations

- **Authentication Required**: All championship actions require user authentication
- **Credit Validation**: System validates sufficient credits before allowing participation
- **Score Validation**: Scores are validated and can only be submitted during active championships
- **Creator Permissions**: Only championship creators can modify their championships
- **Time Validation**: System prevents joining championships that have already started

## Performance Optimizations

- **Database Indexing**: Proper indexes on championship status, game ID, and time fields
- **Caching**: Championship lists can be cached with appropriate invalidation
- **Pagination**: Large championship lists support pagination
- **Real-time Updates**: Consider WebSocket integration for live leaderboard updates

## Future Enhancements

- **Tournament Brackets**: Support for elimination-style tournaments
- **Team Championships**: Allow team-based competitions
- **Recurring Championships**: Automatic creation of weekly/monthly championships
- **Spectator Mode**: Allow non-participants to watch active championships
- **Achievement System**: Badges and achievements for championship performance
- **Advanced Prize Structures**: More complex prize distribution options