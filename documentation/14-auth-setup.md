# Authentication (NextAuth.js) Setup

This project uses NextAuth.js (Auth.js) with the Next.js App Router to provide sign-in/sign-out via Google, Discord, and Email (magic links). Sessions use JWTs by default. The Email provider requires a database adapter (Prisma) to store verification tokens.

## Overview

- Providers: Google OAuth, Discord OAuth, Email (magic link)
- Session strategy: JWT (stateless). Prisma Adapter is used for Email verification tokens and account linking.
- App Router integration: API route handler at `src/app/api/auth/[...nextauth]/route.ts`
- Client integration: `SessionProvider` via `AuthProvider` and conditional UI in `src/components/layout/Header.tsx`

## Files Added/Updated

- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/auth.ts` — Centralized `authOptions` (providers, callbacks, session)
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth API route handler (GET/POST)
- `src/components/providers/AuthProvider.tsx` — Wraps app with `SessionProvider`
- `src/components/providers/index.ts` — Exports `AuthProvider`
- `src/app/layout.tsx` — Wraps content with `AuthProvider` (and existing `PWAProvider`)
- `src/components/layout/Header.tsx` — Uses `useSession`, `signIn`, `signOut` to render auth buttons
- `prisma/schema.prisma` — Prisma schema including NextAuth models (Account, Session, VerificationToken) and existing domain models
- `.env.example` — Environment variables for NextAuth + providers

## Environment Variables

Configure these in `.env.local`:

- `NEXTAUTH_URL` — e.g., `http://localhost:3000`
- `NEXTAUTH_SECRET` — long, random string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`
- `EMAIL_SERVER` — SMTP URL, e.g., `smtp://user:pass@smtp.example.com:587`
- `EMAIL_FROM` — e.g., `Game Portal <no-reply@example.com>`

Note: For Google/Discord, set the OAuth callback URL to `http://localhost:3000/api/auth/callback/<provider>` in your provider console.

## Database (Prisma)

NextAuth Email provider requires database tables for verification tokens. This repo includes `prisma/schema.prisma` with the required models. Run migrations and generate the client:

```
npm install
npx prisma migrate dev
npx prisma generate
```

## How It Works

- API Route: `src/app/api/auth/[...nextauth]/route.ts` exports NextAuth handler for both GET and POST.
- Options: `src/lib/auth.ts` defines providers and callbacks. Sessions are JWT-based. The Prisma adapter enables email verification tokens and account association.
- Client: `AuthProvider` wraps the app to make session data available via `useSession`.
- UI: Header shows Login/Sign Up when logged out (opening NextAuth’s default sign-in page), and the user’s name plus Sign out when logged in.

## Using It in the UI

- Sign in: Use the header Login/Sign Up buttons or call `signIn()` directly. The default NextAuth sign-in page will display Google, Discord, and Email options.
- Sign out: Header’s Sign out button calls `signOut({ callbackUrl: '/' })`.
- Access session: In client components, `const { data: session } = useSession()`; in server components/route handlers, `const session = await getServerSession(authOptions)`.

## Production Notes

- Set secure cookies by ensuring `NEXTAUTH_URL` is https in production.
- Use strong values for `NEXTAUTH_SECRET`.
- Ensure OAuth provider redirect URIs exactly match `NEXTAUTH_URL`.
- For Email provider, use a reliable SMTP service (rate limit and DMARC/SPF/DKIM recommended).

## Optional: Multiplayer Integration

If you want to authorize WebSocket connections to the Colyseus server, add a short-lived “game token” API (e.g., `POST /api/auth/game-token`) that checks `getServerSession(authOptions)`, signs a JWT with user identity, and verify it on the Colyseus side before joining rooms.

