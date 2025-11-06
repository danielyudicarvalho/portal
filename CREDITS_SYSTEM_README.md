# Credits System Implementation

This document outlines the complete credit system implementation for the gaming platform.

## Overview

The credit system allows users to purchase credits with real money and spend those credits to play games. This creates a virtual currency system that provides better control over game access and monetization.

## Features Implemented

### 1. Database Schema
- **User credits field**: Added `credits` column to users table
- **Credit packages**: Predefined packages users can purchase
- **Game costs**: Configurable credit costs per game and game mode
- **Transaction tracking**: Enhanced transaction system for credit operations

### 2. Credit Purchase System
- **Stripe integration**: Secure payment processing for credit purchases
- **Package-based purchasing**: Multiple credit packages with bonus credits
- **Webhook handling**: Automatic credit addition after successful payment

### 3. Credit Spending System
- **Game cost checking**: Verify user has sufficient credits before playing
- **Automatic deduction**: Credits are spent when starting a game
- **Transaction logging**: All credit spending is tracked

### 4. User Interface Components
- **Credit balance display**: Shows current credit balance in header
- **Credit purchase interface**: Beautiful package selection and payment flow
- **Game cost display**: Shows credit cost and handles spending for each game
- **Transaction history**: Complete history of all credit transactions

### 5. Admin Interface
- **Package management**: View and manage credit packages
- **Game cost management**: Configure costs for different games and modes
- **Analytics dashboard**: Basic stats about the credit system

## API Endpoints

### Credit Management
- `GET /api/credits/balance` - Get user's current credit balance
- `GET /api/credits/packages` - Get available credit packages
- `POST /api/credits/purchase` - Create payment intent for credit purchase
- `POST /api/credits/spend` - Spend credits to play a game
- `POST /api/credits/webhook` - Handle Stripe webhooks for credit purchases

### Game Integration
- `GET /api/games/[gameId]/cost` - Get credit cost for a specific game/mode

### Transaction History
- `GET /api/transactions/history` - Get user's transaction history

### Admin APIs
- `GET /api/admin/credit-packages` - Get all credit packages (admin)
- `GET /api/admin/game-costs` - Get all game costs (admin)

## Database Models

### CreditPackage
```prisma
model CreditPackage {
  id          String   @id @default(cuid())
  name        String   // e.g., "Starter Pack"
  credits     Int      // Number of credits
  price       Float    // Price in dollars
  bonusCredits Int     @default(0) // Bonus credits for bulk purchases
  isActive    Boolean  @default(true)
  isPopular   Boolean  @default(false)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### GameCost
```prisma
model GameCost {
  id        String   @id @default(cuid())
  credits   Int      // Cost in credits
  gameMode  String   @default("standard") // "standard", "championship", "multiplayer"
  isActive  Boolean  @default(true)
  gameId    String
  game      Game     @relation(fields: [gameId], references: [id])
}
```

## Default Configuration

### Credit Packages
1. **Starter Pack**: 100 credits for $4.99
2. **Popular Pack**: 250 + 50 bonus credits for $9.99 (Most Popular)
3. **Premium Pack**: 500 + 150 bonus credits for $19.99
4. **Mega Pack**: 1000 + 400 bonus credits for $34.99

### Game Costs
- **Standard games**: 10 credits
- **Championship mode**: 25 credits
- **Multiplayer games**: 15 credits

## Setup Instructions

### 1. Database Migration
```bash
npx prisma db push
```

### 2. Seed Credit System
```bash
node scripts/seed-credits.js
```

### 3. Environment Variables
Ensure these Stripe environment variables are set:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Webhook Configuration
Configure Stripe webhook endpoint: `/api/credits/webhook`
Required events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

## Usage Examples

### Displaying Credit Balance
```tsx
import CreditBalance from '@/components/features/CreditBalance'

<CreditBalance 
  showPurchaseButton={true}
  onPurchaseClick={() => router.push('/credits')}
/>
```

### Game Cost Display
```tsx
import GameCostDisplay from '@/components/features/GameCostDisplay'

<GameCostDisplay 
  gameId="memdot" 
  gameMode="standard"
  onPlayClick={() => {
    console.log('Game started after credit spent')
  }}
/>
```

### Credit Purchase Interface
```tsx
import CreditPurchase from '@/components/features/CreditPurchase'

<CreditPurchase />
```

## Security Considerations

1. **Server-side validation**: All credit operations are validated on the server
2. **Webhook verification**: Stripe webhooks are properly verified
3. **Transaction atomicity**: Credit operations use database transactions
4. **Authentication required**: All credit APIs require user authentication

## Future Enhancements

1. **Admin role system**: Implement proper admin role checking
2. **Credit expiration**: Add expiration dates to credits
3. **Promotional credits**: System for giving free credits
4. **Bulk discounts**: Dynamic pricing based on purchase history
5. **Credit gifting**: Allow users to gift credits to others
6. **Subscription model**: Monthly credit packages
7. **Refund system**: Handle credit refunds for failed games

## Testing

### Test Credit Purchase
1. Go to `/credits` page
2. Select a credit package
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete purchase and verify credits are added

### Test Credit Spending
1. Go to any game page (e.g., `/games/memdot`)
2. Click "Play Game" button
3. Verify credits are deducted and game starts

### Test Insufficient Credits
1. Spend all credits on games
2. Try to play another game
3. Verify "Need More Credits" message appears

## Monitoring

Monitor these metrics:
- Credit purchase conversion rates
- Average credits per user
- Most popular credit packages
- Game play frequency by cost
- Credit balance distribution

## Support

For issues with the credit system:
1. Check Stripe dashboard for payment issues
2. Review transaction logs in database
3. Check webhook delivery in Stripe
4. Verify environment variables are set correctly