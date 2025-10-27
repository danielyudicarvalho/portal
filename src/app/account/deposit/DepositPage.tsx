'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { DepositForm } from '@/components/deposits/DepositForm'
import Button from '@/components/ui/Button'

export function DepositPage() {
  const { data: session } = useSession()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleDepositSuccess = (amount: number) => {
    setMessage({
      type: 'success',
      text: `Successfully deposited R$ ${amount.toFixed(2)}! Your balance will be updated shortly.`
    })
  }

  const handleDepositError = (error: string) => {
    setMessage({
      type: 'error',
      text: error
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark via-gaming-darker to-gaming-dark py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gaming-accent to-gaming-secondary rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-gaming font-bold text-white mb-2">
            Adicionar Fundos
          </h1>
          <p className="text-gray-300 text-lg">
            Deposite dinheiro em sua conta para jogos e compras
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm animate-fade-in ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-400 border-green-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Main Deposit Card */}
        <div className="card-gaming mb-8">
          <DepositForm
            onSuccess={handleDepositSuccess}
            onError={handleDepositError}
          />

          {/* Current Balance Section */}
          <div className="mt-8 pt-6 border-t border-gaming-accent/20">
            <div className="text-center">
              <p className="text-gray-400 text-sm font-medium mb-2">
                Saldo Atual
              </p>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl px-4 py-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="text-2xl font-bold text-green-400">
                  R$ {(session?.user as any)?.balance?.toFixed(2) || '0,00'}
                </span>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full border-gaming-accent/50 text-gray-300 hover:text-white hover:bg-gaming-accent/20 hover:border-gaming-accent"
              onClick={() => window.history.back()}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para Conta
            </Button>
          </div>
        </div>

        {/* Security & Privacy Card */}
        <div className="card-gaming">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-gaming-secondary to-gaming-accent rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-gaming font-bold text-white">
                Segurança & Privacidade
              </h2>
              <p className="text-gray-400 text-sm">
                Seus dados estão protegidos
              </p>
            </div>
          </div>
          
          <ul className="space-y-4">
            {[
              'Todos os pagamentos são processados com segurança através do Stripe',
              'Suas informações de pagamento nunca são armazenadas em nossos servidores',
              'Depósitos são normalmente processados instantaneamente',
              'Depósito mínimo: R$ 5,00, Máximo: R$ 1.000,00'
            ].map((item, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300 text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}