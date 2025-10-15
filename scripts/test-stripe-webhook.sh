#!/bin/bash

echo "🚀 Starting Stripe webhook testing..."
echo ""
echo "This will:"
echo "1. Forward Stripe webhook events to your local server"
echo "2. Listen for payment events on localhost:3000"
echo ""
echo "Make sure your Next.js server is running on port 3000!"
echo ""
echo "Press Ctrl+C to stop the webhook listener"
echo ""

# Forward webhooks to local development server
stripe listen --forward-to localhost:3000/api/deposits/webhook