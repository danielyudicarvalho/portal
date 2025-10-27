# Deposit Feature Documentation

## Overview

The deposit feature allows users to securely add funds to their account balance using Stripe payment processing. These funds can be used for future transactions, game purchases, or other platform activities.

## Features

- **Secure Payment Processing**: Integration with Stripe for PCI-compliant payment handling
- **Flexible Amounts**: Preset amounts ($5, $10, $25, $50, $100) or custom amounts
- **Real-time Updates**: Balance updates immediately after successful payment
- **Transaction History**: Complete audit trail of all deposit transactions
- **Webhook Integration**: Automatic payment confirmation via Stripe webhooks

## Technical Implementation

### Database Schema

New `Transaction` model tracks all financial activities:

```prisma
model Transaction {
  id          String            @id @default(cuid())
  amount      Float
  type        TransactionType   // DEPOSIT, WITHDRAWAL, PURCHASE, REFUND
  status      TransactionStatus // PENDING, COMPLETED, FAILED, CANCELLED
  description String?
  paymentId   String?          // Stripe payment intent ID
  paymentProvider String?      // "stripe"
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      String
  user        User @relation(fields: [userId], references: [id])
}
```

### API Endpoints

- `POST /api/deposits/create-payment-intent` - Creates Stripe payment intent
- `POST /api/deposits/webhook` - Handles Stripe webhook events
- `GET /api/account/balance` - Retrieves user balance and transaction history

### Security Features

1. **Authentication Required**: All deposit endpoints require valid user session
2. **Amount Validation**: Minimum $5, maximum $1,000 per transaction
3. **Webhook Verification**: Stripe signature verification for webhook security
4. **Database Transactions**: Atomic operations for balance updates
5. **PCI Compliance**: No card data stored on servers (handled by Stripe)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Environment Variables

Add to your `.env.local`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### 3. Database Migration

Run the Prisma migration:

```bash
npx prisma migrate dev --name add_transactions
npx prisma generate
```

### 4. Stripe Webhook Setup

1. Create a webhook endpoint in Stripe Dashboard
2. Point to: `https://yourdomain.com/api/deposits/webhook`
3. Listen for events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to environment variables

## Usage

### For Users

1. Navigate to `/account` to view current balance
2. Click "Add Funds" or go to `/account/deposit`
3. Select preset amount or enter custom amount
4. Enter payment information
5. Confirm payment
6. Balance updates automatically upon successful payment

### For Developers

```typescript
// Create payment intent
const response = await fetch('/api/deposits/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 25.00 })
})

// Get user balance
const balance = await fetch('/api/account/balance')
const data = await balance.json()
console.log(`Current balance: $${data.balance}`)
```

## Configuration

### Deposit Limits

Modify limits in `src/lib/stripe.ts`:

```typescript
export const STRIPE_CONFIG = {
  currency: 'usd',
  minimumAmount: 500,  // $5.00 in cents
  maximumAmount: 100000, // $1000.00 in cents
}
```

### Preset Amounts

Update preset amounts in `src/components/deposits/DepositForm.tsx`:

```typescript
const PRESET_AMOUNTS = [5, 10, 25, 50, 100] // Dollar amounts
```

## Error Handling

The system handles various error scenarios:

- **Invalid amounts**: Client-side validation prevents invalid inputs
- **Payment failures**: Webhook updates transaction status to FAILED
- **Network issues**: User-friendly error messages displayed
- **Authentication errors**: Redirects to sign-in page

## Testing

### Test Mode

Use Stripe test keys for development:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/deposits/webhook
```

## Security Considerations

1. **Never store card data**: All payment info handled by Stripe
2. **Validate webhook signatures**: Prevents malicious webhook calls
3. **Use HTTPS in production**: Required for Stripe integration
4. **Implement rate limiting**: Prevent abuse of deposit endpoints
5. **Monitor transactions**: Set up alerts for unusual activity

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook secret matches environment variable
   - Check Stripe dashboard for delivery attempts

2. **Payment succeeds but balance not updated**
   - Check webhook handler logs
   - Verify database transaction completed
   - Check for duplicate payment intent IDs

3. **Client-side errors**
   - Verify publishable key is correct
   - Check browser console for Stripe errors
   - Ensure HTTPS in production

### Monitoring

Monitor these metrics:
- Successful deposit rate
- Average deposit amount
- Failed payment reasons
- Webhook delivery success rate

## Future Enhancements

Potential improvements:
- Multiple payment methods (PayPal, Apple Pay)
- Recurring deposits/subscriptions
- Deposit bonuses and promotions
- Enhanced transaction filtering
- Export transaction history
- Mobile app integration