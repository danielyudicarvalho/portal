# Environment Setup Guide

## Docker Environment Configuration

After cloning this repository, you'll need to set up your environment variables for Docker deployment.

### 1. Copy the environment template

```bash
cp .env.docker.example .env.docker
```

### 2. Configure your OAuth credentials

Edit `.env.docker` and replace the placeholder values:

```bash
# OAuth Providers
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"

# NextAuth.js - Generate a secure secret
NEXTAUTH_SECRET="your-secure-nextauth-secret"
```

### 3. Generate NextAuth Secret

You can generate a secure NextAuth secret using:

```bash
openssl rand -base64 32
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. Add your authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local development)
6. Copy the Client ID and Client Secret to your `.env.docker` file

### 5. Start the application

```bash
docker-compose up -d
```

## Security Notes

- Never commit `.env.docker` to version control
- The `.env.docker.example` file contains safe placeholder values
- All sensitive credentials should be stored in your local `.env.docker` file only
- For production deployment, use proper secret management solutions

## Files Overview

- `.env.docker.example` - Template with placeholder values (safe to commit)
- `.env.docker` - Your actual environment file (ignored by git)
- `docker-compose.yml` - Production Docker configuration
- `docker-compose.dev.yml` - Development Docker configuration

Both Docker Compose files now use `env_file: .env.docker` to load environment variables securely.