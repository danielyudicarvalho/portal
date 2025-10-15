#!/bin/bash

echo "💳 Testing Stripe Payment Events..."
echo ""

# Test successful payment
echo "🟢 Triggering successful payment event..."
stripe trigger payment_intent.succeeded

echo ""
echo "⏳ Waiting 2 seconds..."
sleep 2

# Test failed payment
echo "🔴 Triggering failed payment event..."
stripe trigger payment_intent.payment_failed

echo ""
echo "✅ Test events sent! Check your webhook listener and application logs."