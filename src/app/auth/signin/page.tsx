'use client';

import { useState, useEffect } from 'react';
import { signIn, getProviders, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push(callbackUrl);
      }
    };
    checkSession();
  }, [router, callbackUrl]);

  const handleProviderSignIn = async (providerId: string) => {
    setLoadingProvider(providerId);
    try {
      await signIn(providerId, { callbackUrl });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    try {
      await signIn('email', { email, callbackUrl });
    } catch (error) {
      console.error('Email sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'discord':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
    }
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'OAuthSignin':
        return 'Error occurred during OAuth sign in';
      case 'OAuthCallback':
        return 'Error occurred during OAuth callback';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account';
      case 'EmailCreateAccount':
        return 'Could not create email account';
      case 'Callback':
        return 'Error occurred during callback';
      case 'OAuthAccountNotLinked':
        return 'Account is already linked to another provider';
      case 'EmailSignin':
        return 'Check your email for the sign in link';
      case 'CredentialsSignin':
        return 'Invalid credentials';
      case 'SessionRequired':
        return 'Please sign in to access this page';
      default:
        return 'An error occurred during sign in';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-darker via-gaming-dark to-gaming-darker flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #ff6b35 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #4ecdc4 0%, transparent 50%)`,
        }} />
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gaming-accent to-gaming-secondary rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white font-gaming mb-2">Game Portal</h1>
          <p className="text-gaming-secondary/80">Welcome back, gamer!</p>
        </div>

        <Card variant="gaming" className="backdrop-blur-sm bg-gaming-dark/80 border-gaming-accent/30">
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-gaming-danger/10 border border-gaming-danger/30 rounded-lg">
                <p className="text-gaming-danger text-sm text-center">
                  {getErrorMessage(error)}
                </p>
              </div>
            )}

            {/* OAuth Providers */}
            {providers && Object.values(providers).filter(provider => provider.type === 'oauth').map((provider) => (
              <Button
                key={provider.id}
                onClick={() => handleProviderSignIn(provider.id)}
                loading={loadingProvider === provider.id}
                variant="outline"
                size="lg"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                <div className="flex items-center justify-center space-x-3">
                  {getProviderIcon(provider.id)}
                  <span>Continue with {provider.name}</span>
                </div>
              </Button>
            ))}

            {/* Divider */}
            {providers && Object.values(providers).some(p => p.type === 'oauth') && 
             Object.values(providers).some(p => p.type === 'email') && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gaming-dark text-white/60">or</span>
                </div>
              </div>
            )}

            {/* Email Provider */}
            {providers && Object.values(providers).some(provider => provider.type === 'email') && (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-gaming-accent"
                  leftIcon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  }
                />
                <Button
                  type="submit"
                  loading={isLoading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-gaming-accent to-gaming-secondary hover:from-gaming-accent/90 hover:to-gaming-secondary/90 shadow-lg hover:shadow-gaming-accent/25"
                >
                  Send Magic Link
                </Button>
              </form>
            )}

            {/* Footer */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-white/60 text-sm">
                By signing in, you agree to our{' '}
                <a href="/terms" className="text-gaming-accent hover:text-gaming-accent/80 transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-gaming-accent hover:text-gaming-accent/80 transition-colors">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-white/60 hover:text-white transition-colors text-sm flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            <span>Back to Game Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
}