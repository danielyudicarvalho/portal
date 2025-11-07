import { Metadata } from 'next'
import { Layout } from '@/components/layout'
import CreditPurchase from '@/components/features/CreditPurchase'
import TransactionHistory from '@/components/features/TransactionHistory'

export const metadata: Metadata = {
  title: 'Purchase Credits - Game Portal',
  description: 'Buy credits to play premium games',
}

export default function CreditsPage() {
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gaming-accent/5 via-transparent to-gaming-secondary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gaming-accent/5 via-transparent to-transparent" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gaming-accent/10 rounded-full blur-xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gaming-secondary/10 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        <div className="relative container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <CreditPurchase />
            </div>
            <div className="lg:col-span-1">
              <div className="card-gaming sticky top-8">
                <TransactionHistory />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}