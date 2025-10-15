import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from './prisma'

// Debug environment variables
console.log('🔧 Auth Configuration Debug:')
console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'NOT SET')
console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET')
console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET')
console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')

// Build providers conditionally from environment variables
const providers: NextAuthOptions['providers'] = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Adding Google OAuth provider')
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
} else {
  console.log('❌ Google OAuth provider NOT added - missing credentials')
}

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  console.log('✅ Adding Discord OAuth provider')
  providers.push(
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    })
  )
} else {
  console.log('⚠️ Discord OAuth provider NOT added - missing credentials')
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  console.log('✅ Adding Email provider')
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  )
} else {
  console.log('⚠️ Email provider NOT added - missing credentials')
}

console.log(`📊 Total providers configured: ${providers.length}`)

// Create a custom adapter with logging
const customAdapter = {
  ...PrismaAdapter(prisma),
  async createUser(user: any) {
    console.log('🔧 Adapter: createUser called with:', user)
    try {
      // Generate a unique username from email if not provided
      const username = user.email ? user.email.split('@')[0] + '_' + Date.now() : null
      
      const userData = {
        ...user,
        username: username
      }
      
      console.log('🔧 Adapter: Creating user with data:', userData)
      const result = await prisma.user.create({
        data: userData
      })
      console.log('✅ Adapter: createUser successful:', result)
      return result
    } catch (error) {
      console.error('❌ Adapter: createUser failed:', error)
      throw error
    }
  },
  async linkAccount(account: any) {
    console.log('🔧 Adapter: linkAccount called with:', account)
    try {
      const result = await PrismaAdapter(prisma).linkAccount!(account)
      console.log('✅ Adapter: linkAccount successful:', result)
      return result
    } catch (error) {
      console.error('❌ Adapter: linkAccount failed:', error)
      throw error
    }
  },
  async getUserByEmail(email: string) {
    console.log('🔧 Adapter: getUserByEmail called with:', email)
    try {
      const result = await PrismaAdapter(prisma).getUserByEmail!(email)
      console.log('✅ Adapter: getUserByEmail result:', result ? 'User found' : 'User not found')
      return result
    } catch (error) {
      console.error('❌ Adapter: getUserByEmail failed:', error)
      throw error
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers,
  callbacks: {
    async session({ session, user }) {
      console.log('🔄 Session callback called:', { 
        sessionUser: session.user?.email, 
        userId: user?.id 
      })
      if (session.user && user?.id) {
        ;(session.user as any).id = user.id
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log('🚀 SignIn callback started')
      console.log('📝 SignIn details:', {
        provider: account?.provider,
        email: user?.email,
        name: user?.name,
        accountId: account?.providerAccountId,
        accountType: account?.type,
        userId: user?.id
      })
      
      try {
        // Test database connection
        console.log('🔍 Testing database connection...')
        await prisma.$connect()
        console.log('✅ Database connection successful')
        
        // Check if user already exists
        if (user?.email) {
          console.log('🔍 Checking for existing user with email:', user.email)
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: {
              accounts: true
            }
          })
          
          if (existingUser) {
            console.log('👤 Existing user found:', {
              id: existingUser.id,
              email: existingUser.email,
              accountsCount: existingUser.accounts.length
            })
            
            // Check if this provider account already exists
            const existingAccount = existingUser.accounts.find(
              acc => acc.provider === account?.provider && acc.providerAccountId === account?.providerAccountId
            )
            
            if (existingAccount) {
              console.log('🔗 Existing account found for this provider')
            } else {
              console.log('🆕 New provider account for existing user')
            }
          } else {
            console.log('🆕 New user registration for:', user.email)
          }
        }
        
        console.log('✅ SignIn callback completed successfully')
        return true
      } catch (error) {
        console.error('❌ SignIn callback error:', error)
        console.error('📊 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        return false
      }
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('🎉 SignIn event triggered:', {
        email: user?.email,
        provider: account?.provider,
        isNewUser: isNewUser,
        timestamp: new Date().toISOString()
      })
    },
    async createUser({ user }) {
      console.log('👤 CreateUser event triggered:', {
        email: user?.email,
        id: user?.id,
        timestamp: new Date().toISOString()
      })
    },
    async linkAccount({ user, account, profile }) {
      console.log('🔗 LinkAccount event triggered:', {
        userId: user?.id,
        provider: account?.provider,
        accountId: account?.providerAccountId,
        timestamp: new Date().toISOString()
      })
    },
    async session({ session, token }) {
      console.log('📋 Session event triggered:', {
        email: session?.user?.email,
        timestamp: new Date().toISOString()
      })
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
