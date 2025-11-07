import Stripe from 'stripe'

// Make Stripe optional for Docker builds without payment features
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set - payment features will be disabled');
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
  typescript: true,
}) : null;
