'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Button from '@/components/ui/Button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PRESET_AMOUNTS = [5, 10, 25, 50, 100]

interface DepositFormProps {
  onSuccess?: (amount: number) => void
  onError?: (error: string) => void
}

function DepositFormContent({ onSuccess, onError }: DepositFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState<number>(10)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [useCustomAmount, setUseCustomAmount] = useState(false)

  const finalAmount = useCustomAmount ? parseFloat(customAmount) || 0 : amount

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (finalAmount < 5 || finalAmount > 1000) {
      onError?.('Amount must be between R$ 5 and R$ 1000')
      return
    }

    setIsProcessing(true)

    try {
      // Create payment intent
      const response = await fetch('/api/deposits/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: finalAmount }),
      })

      const { clientSecret, error } = await response.json()

      if (error) {
        onError?.(error)
        return
      }

      // Confirm payment
      const cardElement = elements.getElement(CardElement)!
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (confirmError) {
        onError?.(confirmError.message || 'Payment failed')
      } else {
        onSuccess?.(finalAmount)
      }
    } catch (error) {
      onError?.('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-4 flex items-center space-x-2">
          <svg className="w-5 h-5 text-gaming-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <span>Selecionar Valor</span>
        </label>
        
        {!useCustomAmount && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {PRESET_AMOUNTS.map((presetAmount) => (
              <button
                key={presetAmount}
                type="button"
                onClick={() => setAmount(presetAmount)}
                className={`p-4 text-center border rounded-xl transition-all duration-200 font-semibold ${
                  amount === presetAmount
                    ? 'border-gaming-accent bg-gaming-accent/20 text-gaming-accent shadow-lg shadow-gaming-accent/25'
                    : 'border-gray-600/50 bg-gray-800/50 text-gray-300 hover:border-gaming-accent/50 hover:bg-gaming-accent/10 hover:text-white'
                }`}
              >
                R$ {presetAmount}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-3 mb-4">
          <input
            type="checkbox"
            id="custom-amount"
            checked={useCustomAmount}
            onChange={(e) => setUseCustomAmount(e.target.checked)}
            className="w-4 h-4 text-gaming-accent bg-gray-800 border-gray-600 rounded focus:ring-gaming-accent focus:ring-2"
          />
          <label htmlFor="custom-amount" className="text-sm text-gray-300 font-medium">
            Inserir valor personalizado
          </label>
        </div>

        {useCustomAmount && (
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
              R$
            </span>
            <input
              type="number"
              min="5"
              max="1000"
              step="0.01"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="0,00"
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder:text-gray-500 focus:ring-2 focus:ring-gaming-accent focus:border-gaming-accent transition-all duration-200"
            />
          </div>
        )}
      </div>

      {/* Payment Information */}
      <div>
        <label className="block text-sm font-medium text-white mb-4 flex items-center space-x-2">
          <svg className="w-5 h-5 text-gaming-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Informações de Pagamento</span>
        </label>
        <div className="p-4 bg-gray-800/50 border border-gray-600/50 rounded-xl focus-within:border-gaming-secondary focus-within:ring-2 focus-within:ring-gaming-secondary/20 transition-all duration-200">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                  iconColor: '#4ecdc4',
                },
                invalid: {
                  color: '#f87171',
                  iconColor: '#f87171',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-gaming-accent/10 to-gaming-secondary/10 border border-gaming-accent/30 p-4 rounded-xl">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-300">Total do Depósito:</span>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-2xl font-bold text-green-400">
              R$ {finalAmount.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing || finalAmount < 5}
        className="w-full bg-gradient-to-r from-gaming-accent to-gaming-secondary hover:from-gaming-accent/90 hover:to-gaming-secondary/90 text-white font-bold py-4 text-lg shadow-lg hover:shadow-gaming-accent/30 transition-all duration-200 transform hover:scale-105 active:scale-95"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processando...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Depositar R$ {finalAmount.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
      </Button>
    </form>
  )
}

export function DepositForm(props: DepositFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <DepositFormContent {...props} />
    </Elements>
  )
}