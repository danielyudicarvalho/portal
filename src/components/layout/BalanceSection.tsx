'use client'

import React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useBalance } from '@/hooks/useBalance'
import { UserIcon, WalletIcon } from '@heroicons/react/24/solid'

interface BalanceSectionProps {
  className?: string
}

export function BalanceSection({ className = '' }: BalanceSectionProps) {
  const { data: session, status } = useSession()
  const { balance, loading } = useBalance()

  // Não mostrar se não estiver autenticado
  if (status !== 'authenticated' || !session?.user) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Saldo com design moderno */}
      <Link href="/account" className="group">
        <div className="balance-card flex items-center rounded-xl px-4 py-2.5 min-w-[140px] cursor-pointer">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <WalletIcon className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform duration-200" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs font-medium">Saldo</span>
              <span className="text-white text-sm font-bold">
                {loading ? (
                  <span className="animate-pulse text-gray-400">Carregando...</span>
                ) : (
                  <span className="text-green-400 font-bold tracking-wide">
                    R$ {balance.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Botão Depositar Premium */}
      <Link href="/account/deposit">
        <button className="deposit-button relative overflow-hidden text-white font-bold px-5 py-2.5 rounded-xl text-sm transform active:scale-95 group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <span className="relative flex items-center space-x-2">
            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-semibold">Depositar</span>
          </span>
        </button>
      </Link>
    </div>
  )
}