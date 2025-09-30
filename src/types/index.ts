// Core type definitions for the game portal

export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  balance: number
  isActive: boolean
  role: 'USER' | 'ADMIN'
  createdAt: Date
  updatedAt: Date
}

export interface Game {
  id: string
  title: string
  slug: string
  description: string
  thumbnail: string
  category: GameCategory
  provider: string
  isActive: boolean
  isFeatured: boolean
  popularity: number
  createdAt: Date
  updatedAt: Date
  tags: string[]
}

export interface GameCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  order: number
  isActive: boolean
  games?: Game[]
}

export interface GameSession {
  id: string
  userId: string
  gameId: string
  startTime: Date
  endTime?: Date
  duration?: number
  user: User
  game: Game
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
}