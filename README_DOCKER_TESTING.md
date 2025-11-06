# 🐳 Docker Testing Guide for Credit System

This guide provides complete instructions for testing the entire gaming app with the new credit system using Docker.

## 🚀 Quick Start (TL;DR)

```bash
# 1. Check dependencies
./scripts/check-dependencies.sh

# 2. Setup the entire system with credits
npm run docker:setup-credits

# 3. Run automated tests
npm run docker:test-credits

# 4. Open browser and test manually
open http://localhost:3000
```

## 📋 Prerequisites

- Docker and Docker Compose installed
- `jq` for JSON testing (will be installed automatically)
- `curl` for API testing
- At least 4GB RAM available for Docker

## 🛠️ Available Commands

### Setup Commands
```bash
# Setup entire system with credit system
npm run docker:setup-credits

# Clean setup (removes all data)
./scripts/docker-setup-credits.sh --clean

# Check if dependencies are installed
./scripts/check-dependencies.sh
```

### Testing Commands
```bash
# Test credit system specifically
npm run docker:test-credits

# Test basic Docker setup
npm run docker:test

# Manual testing guide
cat DOCKER_CREDIT_TESTING_GUIDE.md
```

### Management Commands
```bash
# Start services
npm run docker:start

# Stop services
npm run docker:stop

# View logs
npm run docker:logs

# Clean restart
npm run docker:clean
```

## 🎯 What Gets Tested

### Automated Tests (35+ tests)
- ✅ Container health checks
- ✅ Database connectivity and schema
- ✅ Credit system APIs
- ✅ Game integration
- ✅ Admin interface
- ✅ Data seeding verification
- ✅ Environment configuration

### Manual Testing Areas
- 🔐 User authentication
- 💳 Credit purchase flow
- 🎮 Game credit spending
- 📊 Transaction history
- 👨‍💼 Admin interface
- 🚫 Error handling

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL    │    │     Redis       │
│   Port: 3000    │◄──►│   Port: 5432    │    │   Port: 6379    │
│                 │    │                 │    │                 │
│ • Credit System │    │ • User Credits  │    │ • Sessions      │
│ • Game Pages    │    │ • Transactions  │    │ • Cache         │
│ • Stripe API    │    │ • Game Costs    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Multiplayer     │
│ Server          │
│ Port: 3002      │
└─────────────────┘
```

## 💳 Credit System Features Tested

### 1. Credit Packages
- **Starter Pack**: 100 credits for $4.99
- **Popular Pack**: 250 + 50 bonus credits for $9.99
- **Premium Pack**: 500 + 150 bonus credits for $19.99
- **Mega Pack**: 1000 + 400 bonus credits for $34.99

### 2. Game Costs
- **Standard games**: 10 credits
- **Championship mode**: 25 credits
- **Multiplayer games**: 15 credits

### 3. User Experience
- Credit balance in header
- Purchase flow with Stripe
- Automatic credit deduction
- Transaction history
- Admin management

## 🔧 Troubleshooting

### Common Issues

#### 1. Containers won't start
```bash
# Check Docker status
docker info

# Clean restart
./scripts/docker-setup-credits.sh --clean
```

#### 2. Database connection errors
```bash
# Check database
docker compose exec postgres pg_isready -U gameuser -d game_portal

# View database logs
docker compose logs postgres
```

#### 3. Credit system not working
```bash
# Re-seed credit data
docker compose exec app node scripts/seed-credits.js

# Check credit packages
docker compose exec postgres psql -U gameuser -d game_portal -c "SELECT * FROM credit_packages;"
```

#### 4. Tests failing
```bash
# Check dependencies
./scripts/check-dependencies.sh

# View detailed logs
docker compose logs -f app

# Check application health
curl http://localhost:3000/api/health
```

### Debug Commands

```bash
# Access application container
docker compose exec app sh

# Access database
docker compose exec postgres psql -U gameuser -d game_portal

# Check Redis
docker compose exec redis redis-cli ping

# View all containers
docker compose ps

# Check resource usage
docker stats
```

## 📈 Performance Considerations

### Resource Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **CPU**: 2 cores minimum
- **Disk**: 2GB for images and data
- **Network**: Internet connection for Stripe testing

### Optimization Tips
```bash
# Limit container resources
docker compose up --scale multiplayer-server=1

# Clean unused resources
docker system prune -f

# Monitor resource usage
docker stats --no-stream
```

## 🧪 Test Scenarios

### Scenario 1: New User Journey
1. Sign up with Google OAuth
2. Receive 50 free credits
3. Play a standard game (10 credits)
4. Try championship mode (25 credits)
5. Purchase more credits
6. View transaction history

### Scenario 2: Credit Purchase Flow
1. Go to credits page
2. Select a package
3. Enter Stripe test card
4. Complete purchase
5. Verify credits added
6. Check transaction recorded

### Scenario 3: Insufficient Credits
1. Spend all credits
2. Try to play a game
3. See "Need More Credits" message
4. Purchase credits
5. Successfully play game

### Scenario 4: Admin Management
1. Access admin panel
2. View credit packages
3. Check game costs
4. Review statistics

## 📊 Monitoring & Logs

### Key Log Files
```bash
# Application logs
docker compose logs app

# Database logs
docker compose logs postgres

# All services
docker compose logs -f
```

### Health Checks
- **App**: http://localhost:3000/api/health
- **Multiplayer**: http://localhost:3002/health
- **Database**: `pg_isready` command
- **Redis**: `redis-cli ping`

## 🎉 Success Criteria

The system is working correctly when:
- ✅ All automated tests pass (35+ tests)
- ✅ Manual testing scenarios complete successfully
- ✅ No errors in application logs
- ✅ Credit purchases work with Stripe test cards
- ✅ Games deduct credits properly
- ✅ Transaction history is accurate
- ✅ Admin interface displays correct data

## 📞 Getting Help

If you encounter issues:

1. **Check the automated tests**: `npm run docker:test-credits`
2. **Review logs**: `docker compose logs -f`
3. **Verify database**: Connect and check tables
4. **Test APIs manually**: Use curl commands
5. **Clean restart**: Use `--clean` flag
6. **Check dependencies**: Run dependency check script

## 🔗 Related Documentation

- [Credit System README](CREDITS_SYSTEM_README.md)
- [Docker Testing Guide](DOCKER_CREDIT_TESTING_GUIDE.md)
- [Main README](README.md)

---

**Happy Testing! 🎮💳**