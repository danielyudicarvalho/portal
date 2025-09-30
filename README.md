# Game Portal

A modern gaming portal built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🎮 Modern gaming platform interface
- 🔐 User authentication with NextAuth.js
- 📱 Responsive design with mobile-first approach
- 🎨 Dark theme with gaming aesthetics
- 🗄️ PostgreSQL database with Prisma ORM
- ⚡ Fast loading with Next.js App Router
- 🔍 Game search and filtering
- 👤 User profiles and favorites
- 🛡️ Admin interface for content management

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js
- **UI Components**: Headless UI
- **Icons**: Heroicons

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Update the database URL and other configuration values.

3. **Set up the database**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Dashboard route group
│   ├── games/             # Game-related pages
│   ├── admin/             # Admin interface
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
├── lib/                  # Utility functions and configurations
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── styles/               # Global styles and Tailwind config
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Database Schema

The application uses Prisma with PostgreSQL. Key models include:

- **User**: User accounts with authentication
- **Game**: Game catalog with metadata
- **GameCategory**: Game categorization
- **GameSession**: User game sessions
- **UserFavorite**: User favorite games

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.