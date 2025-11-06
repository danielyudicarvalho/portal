# Docker Credit System Testing Guide

This guide will help you test the complete credit system using Docker.

## 🚀 Quick Start

### 1. Setup and Start the System
```bash
# Clean setup (recommended for first time)
./scripts/docker-setup-credits.sh --clean

# Or regular setup
./scripts/docker-setup-credits.sh
```

### 2. Run Automated Tests
```bash
# Test the credit system
./scripts/docker-test-credits.sh
```

### 3. Manual Testing
Open your browser and go to: http://localhost:3000

## 📋 Complete Testing Checklist

### Phase 1: Basic Setup Verification
- [ ] All containers are running (`docker compose ps`)
- [ ] Database is accessible
- [ ] Application loads at http://localhost:3000
- [ ] Health check passes at http://localhost:3000/api/health

### Phase 2: Authentication & Initial Credits
- [ ] Sign in with Google OAuth
- [ ] Check that you have 50 free credits (visible in header)
- [ ] Navigate to different pages without errors

### Phase 3: Credit Purchase System
- [ ] Go to http://localhost:3000/credits
- [ ] See 4 credit packages:
  - [ ] Starter Pack: 100 credits for $4.99
  - [ ] Popular Pack: 250 + 50 bonus credits for $9.99 (marked as popular)
  - [ ] Premium Pack: 500 + 150 bonus credits for $19.99
  - [ ] Mega Pack: 1000 + 400 bonus credits for $34.99
- [ ] Click on a package to open payment modal
- [ ] See Stripe payment form
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Any future expiry date (e.g., 12/25)
- [ ] Any 3-digit CVC (e.g., 123)
- [ ] Complete purchase successfully
- [ ] See credits added to your balance
- [ ] Check transaction appears in history

### Phase 4: Game Credit Costs
- [ ] Go to http://localhost:3000/games/memdot
- [ ] See "10 credits" cost display
- [ ] Click "Play Game" button
- [ ] Confirm credits are deducted (balance decreases by 10)
- [ ] Game loads successfully

### Phase 5: Championship Mode
- [ ] Go to http://localhost:3000/games/memdot/championship
- [ ] See "25 credits" cost display
- [ ] Click "Play Game" button
- [ ] Confirm credits are deducted (balance decreases by 25)
- [ ] Game loads successfully

### Phase 6: Insufficient Credits
- [ ] Spend all your credits on games
- [ ] Try to play another game
- [ ] See "Need More Credits" button
- [ ] Click button shows insufficient credits message
- [ ] Game does not start

### Phase 7: Transaction History
- [ ] Go to http://localhost:3000/credits
- [ ] See transaction history on the right side
- [ ] Verify all transactions are listed:
  - [ ] Credit purchases (green, positive amounts)
  - [ ] Game plays (blue, negative amounts)
  - [ ] Correct timestamps
  - [ ] Proper descriptions

### Phase 8: Admin Interface
- [ ] Go to http://localhost:3000/admin/credits
- [ ] See credit packages management
- [ ] See game costs configuration
- [ ] See statistics (total packages, active packages, game costs)

### Phase 9: API Testing
Test these endpoints manually or with curl:

```bash
# Get credit packages
curl http://localhost:3000/api/credits/packages

# Get user balance (requires authentication)
curl http://localhost:3000/api/credits/balance

# Get transaction history (requires authentication)
curl http://localhost:3000/api/transactions/history

# Get game cost
curl http://localhost:3000/api/games/memdot/cost?mode=standard
curl http://localhost:3000/api/games/memdot/cost?mode=championship
```

### Phase 10: Error Handling
- [ ] Try to play game without sufficient credits
- [ ] Try to access credit APIs without authentication
- [ ] Test with invalid game IDs
- [ ] Test with invalid credit package IDs

## 🔧 Debugging Commands

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f postgres
```

### Database Access
```bash
# Connect to database
docker compose exec postgres psql -U gameuser -d game_portal

# Check credit packages
SELECT * FROM credit_packages;

# Check game costs
SELECT gc.*, g.title FROM game_costs gc JOIN games g ON gc."gameId" = g.id;

# Check user credits
SELECT email, credits FROM users;

# Check transactions
SELECT * FROM transactions ORDER BY "createdAt" DESC LIMIT 10;
```

### Application Shell
```bash
# Access app container
docker compose exec app sh

# Run Prisma commands
npx prisma studio
npx prisma db seed
node scripts/seed-credits.js
```

## 🎯 Expected Behavior

### Credit Packages
- **Starter Pack**: 100 credits, $4.99, no bonus
- **Popular Pack**: 250 + 50 bonus = 300 total credits, $9.99, marked popular
- **Premium Pack**: 500 + 150 bonus = 650 total credits, $19.99
- **Mega Pack**: 1000 + 400 bonus = 1400 total credits, $34.99

### Game Costs
- **Standard games**: 10 credits
- **Championship mode**: 25 credits
- **Multiplayer games**: 15 credits

### User Experience
- Credit balance always visible in header
- Clear cost display before playing games
- Automatic credit deduction when playing
- Transaction history tracking
- Insufficient credits prevention

## 🚨 Common Issues & Solutions

### Issue: Containers won't start
```bash
# Clean restart
docker compose down --volumes
docker system prune -f
./scripts/docker-setup-credits.sh --clean
```

### Issue: Database connection errors
```bash
# Check database status
docker compose exec postgres pg_isready -U gameuser -d game_portal

# Restart database
docker compose restart postgres
```

### Issue: Credit system not working
```bash
# Re-seed credit system
docker compose exec app node scripts/seed-credits.js

# Check database schema
docker compose exec postgres psql -U gameuser -d game_portal -c "\dt"
```

### Issue: Stripe errors
- Verify environment variables are set
- Use test card: 4242 4242 4242 4242
- Check Stripe keys are test keys (start with sk_test_ and pk_test_)

### Issue: No free credits
```bash
# Give yourself credits manually
docker compose exec postgres psql -U gameuser -d game_portal -c "UPDATE users SET credits = 100 WHERE email = 'your-email@gmail.com';"
```

## 📊 Performance Testing

### Load Testing Credit Purchase
```bash
# Test multiple concurrent purchases (be careful with test limits)
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/credits/packages &
done
wait
```

### Database Performance
```bash
# Check query performance
docker compose exec postgres psql -U gameuser -d game_portal -c "EXPLAIN ANALYZE SELECT * FROM credit_packages WHERE isActive = true;"
```

## 🎉 Success Criteria

The credit system is working correctly if:
- ✅ All automated tests pass
- ✅ Users can purchase credits with Stripe
- ✅ Credits are deducted when playing games
- ✅ Transaction history is accurate
- ✅ Admin interface shows correct data
- ✅ Error handling works properly
- ✅ No console errors in browser
- ✅ Database integrity is maintained

## 📞 Support

If you encounter issues:
1. Check the automated test results
2. Review the logs with `docker compose logs -f`
3. Verify database state with SQL queries
4. Check environment variables
5. Ensure Stripe test keys are configured
6. Try a clean restart with `--clean` flag