'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { SparklesIcon, CreditCardIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FireIcon } from '@heroicons/react/24/solid'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  bonusCredits: number
  isPopular: boolean
}

interface CreditPurchaseFormProps {
  selectedPackage: CreditPackage
  onSuccess: () => void
  onCancel: () => void
}

function CreditPurchaseForm({ selectedPackage, onSuccess, onCancel }: CreditPurchaseFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    setIsProcessing(true)
    setError(null)

    try {
      if (!stripe || !elements || !stripePromise) {
        // Demo mode - simulate purchase without Stripe
        console.log('Demo mode: Simulating credit purchase...')
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Simulate adding credits directly (for demo purposes)
        const response = await fetch('/api/credits/demo-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            packageId: selectedPackage.id,
          }),
        })

        if (!response.ok) {
          throw new Error('Demo purchase failed')
        }

        onSuccess()
        return
      }

      // Real Stripe payment flow
      // Create payment intent
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
        }),
      })

      const { clientSecret, error: apiError } = await response.json()

      if (apiError) {
        throw new Error(apiError)
      }

      // Confirm payment
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const totalCredits = selectedPackage.credits + selectedPackage.bonusCredits

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="card-gaming max-w-md w-full animate-modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gaming-accent/20 rounded-full flex items-center justify-center">
              <CreditCardIcon className="h-5 w-5 text-gaming-accent" />
            </div>
            <h3 className="text-xl font-gaming font-bold text-white">Purchase Credits</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white hover:bg-gaming-accent/10 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Package Details */}
        <div className="mb-6 p-4 bg-gradient-to-br from-gaming-accent/10 to-gaming-secondary/10 rounded-lg border border-gaming-accent/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-gaming-accent to-gaming-secondary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <h4 className="font-gaming font-semibold text-white">{selectedPackage.name}</h4>
            {selectedPackage.isPopular && (
              <span className="bg-gaming-accent text-white px-2 py-1 rounded-full text-xs font-medium">
                Popular
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Base Credits:</span>
              <span className="text-white font-medium">{selectedPackage.credits}</span>
            </div>
            {selectedPackage.bonusCredits > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Bonus Credits:</span>
                <span className="text-gaming-secondary font-medium">+{selectedPackage.bonusCredits}</span>
              </div>
            )}
            <div className="border-t border-gaming-accent/20 pt-2">
              <div className="flex justify-between">
                <span className="text-white font-medium">Total Credits:</span>
                <span className="text-gaming-accent font-bold text-lg">{totalCredits}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-white font-medium">Price:</span>
                <span className="text-gaming-accent font-bold text-lg">${selectedPackage.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Card Details
            </label>
            <div className="bg-gaming-dark/50 border border-gaming-accent/20 rounded-lg p-4 min-h-[50px] flex items-center">
              {stripePromise ? (
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#ffffff',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        backgroundColor: 'transparent',
                        '::placeholder': {
                          color: '#9ca3af',
                        },
                      },
                      invalid: {
                        color: '#f87171',
                      },
                      complete: {
                        color: '#10b981',
                      },
                    },
                  }}
                />
              ) : (
                <div className="w-full">
                  <div className="flex items-center gap-2 text-gaming-accent text-sm mb-2">
                    <div className="w-4 h-4 bg-gaming-accent rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <span className="font-medium">Demo Mode</span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    Stripe not configured. This will simulate a purchase for testing.
                    <br />
                    <span className="text-gaming-secondary">No real payment will be processed.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors font-medium"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-gaming-accent to-gaming-accent/80 text-white rounded-lg hover:from-gaming-accent/90 hover:to-gaming-accent/70 disabled:opacity-50 transition-all font-medium glow-accent"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : stripePromise ? (
                `Pay $${selectedPackage.price.toFixed(2)}`
              ) : (
                `Demo Purchase $${selectedPackage.price.toFixed(2)}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CreditPurchase() {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userCredits, setUserCredits] = useState(0)

  useEffect(() => {
    fetchPackages()
    fetchUserCredits()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/credits/packages')
      const data = await response.json()
      setPackages(data.packages || [])
    } catch (error) {
      console.error('Failed to fetch credit packages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/credits/balance')
      const data = await response.json()
      setUserCredits(data.credits || 0)
    } catch (error) {
      console.error('Failed to fetch user credits:', error)
    }
  }

  const handlePurchaseSuccess = () => {
    setSelectedPackage(null)
    fetchUserCredits() // Refresh credit balance
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-gaming-accent/30 border-t-gaming-accent rounded-full animate-spin"></div>
          <span className="text-gray-300">Loading credit packages...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-gaming-accent to-gaming-secondary rounded-full flex items-center justify-center mr-4">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-gaming font-bold text-gradient">Purchase Credits</h2>
        </div>
        <p className="text-gray-300 max-w-2xl mx-auto mb-4">
          Fuel your gaming experience with credits. Play premium games, enter championships, and compete with players worldwide.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gaming-accent/10 border border-gaming-accent/20 rounded-full">
          <div className="w-5 h-5 bg-gradient-to-r from-gaming-accent to-gaming-secondary rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-gray-300">Current balance:</span>
          <span className="font-bold text-gaming-accent">{userCredits} credits</span>
        </div>
      </div>

      {/* Credit Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg, index) => {
          const totalCredits = pkg.credits + pkg.bonusCredits
          const pricePerCredit = pkg.price / totalCredits

          return (
            <div
              key={pkg.id}
              className={`relative card-gaming cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group animate-fade-in ${
                pkg.isPopular
                  ? 'ring-2 ring-gaming-accent glow-accent'
                  : 'hover:border-gaming-accent/40'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => setSelectedPackage(pkg)}
            >
              {/* Popular Badge */}
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-gaming-accent to-gaming-secondary text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    <SparklesIcon className="h-4 w-4 inline mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Package Content */}
              <div className="text-center relative">
                {/* Package Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gaming-accent/20 to-gaming-secondary/20 rounded-full flex items-center justify-center border border-gaming-accent/30">
                  <div className="w-8 h-8 bg-gradient-to-r from-gaming-accent to-gaming-secondary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{pkg.credits.toString().charAt(0)}</span>
                  </div>
                </div>

                {/* Package Name */}
                <h3 className="text-xl font-gaming font-bold text-white mb-2">{pkg.name}</h3>
                
                {/* Price */}
                <div className="text-3xl font-bold text-gradient mb-4">
                  ${pkg.price.toFixed(2)}
                </div>
                
                {/* Credits Breakdown */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Base Credits:</span>
                    <span className="text-white font-medium">{pkg.credits}</span>
                  </div>
                  {pkg.bonusCredits > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Bonus:</span>
                      <span className="text-gaming-secondary font-medium">+{pkg.bonusCredits}</span>
                    </div>
                  )}
                  <div className="border-t border-gaming-accent/20 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">Total:</span>
                      <span className="text-gaming-accent font-bold text-lg">{totalCredits} credits</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    ${pricePerCredit.toFixed(3)} per credit
                  </div>
                </div>
                
                {/* Purchase Button */}
                <button className="w-full bg-gradient-to-r from-gaming-accent to-gaming-accent/80 text-white py-3 px-4 rounded-lg hover:from-gaming-accent/90 hover:to-gaming-accent/70 transition-all font-medium group-hover:shadow-lg group-hover:shadow-gaming-accent/25">
                  <FireIcon className="h-4 w-4 inline mr-2" />
                  Purchase
                </button>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-gaming-accent/5 to-gaming-secondary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          )
        })}
      </div>

      {/* Features Section */}
      <div className="mt-12 text-center">
        <h3 className="text-xl font-gaming font-bold text-white mb-6">Why Choose Our Credits?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🎮',
              title: 'Premium Games',
              description: 'Access exclusive games and premium content'
            },
            {
              icon: '🏆',
              title: 'Championships',
              description: 'Enter high-stakes tournaments and competitions'
            },
            {
              icon: '⚡',
              title: 'Instant Access',
              description: 'Credits are added immediately after purchase'
            }
          ].map((feature, index) => (
            <div key={index} className="p-4 bg-gaming-dark/50 rounded-lg border border-gaming-accent/10">
              <div className="text-3xl mb-2">{feature.icon}</div>
              <h4 className="font-medium text-white mb-1">{feature.title}</h4>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPackage && (
        <Elements stripe={stripePromise}>
          <CreditPurchaseForm
            selectedPackage={selectedPackage}
            onSuccess={handlePurchaseSuccess}
            onCancel={() => setSelectedPackage(null)}
          />
        </Elements>
      )}
    </div>
  )
}