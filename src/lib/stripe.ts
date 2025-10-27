import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const STRIPE_CONFIG = {
  currency: 'usd',
  minimumAmount: 500, // $5.00 minimum deposit
  maximumAmount: 100000, // $1000.00 maximum deposit
}