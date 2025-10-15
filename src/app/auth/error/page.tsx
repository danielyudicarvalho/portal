'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorDetails = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description: 'There is a problem with the server configuration. Please contact support.',
          icon: '⚙️'
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to sign in with this account.',
          icon: '🚫'
        };
      case 'Verification':
        return {
          title: 'Verification Failed',
          description: 'The verification link has expired or has already been used.',
          icon: '⏰'
        };
      case 'OAuthCreateAccount':
        return {
          title: 'Could not create OAuth account',
          description: 'There was an issue creating your account. This might be due to an existing account with the same email or a configuration issue.',
          icon: '🔗'
        };
      case 'OAuthCallback':
        return {
          title: 'OAuth Callback Error',
          description: 'There was an error during the OAuth callback. Please check your OAuth provider configuration.',
          icon: '🔄'
        };
      case 'OAuthSignin':
        return {
          title: 'OAuth Sign-in Error',
          description: 'There was an error during OAuth sign-in. Please try again or contact support.',
          icon: '🔐'
        };
      case 'Default':
      default:
        return {
          title: 'Authentication Error',
          description: 'An unexpected error occurred during authentication. Please try again.',
          icon: '❌'
        };
    }
  };

  const errorDetails = getErrorDetails(error);

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
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gaming-danger to-gaming-warning rounded-full mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 5h4v6h-4zm0 8h4v2h-4z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white font-gaming mb-2">Oops!</h1>
          <p className="text-gaming-danger/80">Something went wrong</p>
        </div>

        <Card variant="gaming" className="backdrop-blur-sm bg-gaming-dark/80 border-gaming-danger/30">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-gaming-danger/10 border border-gaming-danger/30 rounded-lg">
                <div className="text-4xl mb-3">{errorDetails.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{errorDetails.title}</h3>
                <p className="text-white/70 text-sm">
                  {errorDetails.description}
                </p>
              </div>

              {error === 'Verification' && (
                <div className="bg-gaming-dark/50 rounded-lg p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-2">What can you do?</h4>
                  <ul className="text-white/70 text-sm space-y-1 text-left">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-gaming-accent rounded-full"></span>
                      <span>Request a new sign-in link</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-gaming-accent rounded-full"></span>
                      <span>Make sure to use the latest email</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-gaming-accent rounded-full"></span>
                      <span>Check your email for the newest link</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/signin')}
                variant="primary"
                size="lg"
                className="w-full bg-gradient-to-r from-gaming-accent to-gaming-secondary hover:from-gaming-accent/90 hover:to-gaming-secondary/90"
              >
                Try Again
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                size="md"
                className="w-full text-white/70 hover:text-white hover:bg-white/5"
              >
                Return to Home
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-white/50 text-xs">
                Still having trouble?{' '}
                <a href="mailto:support@gameportal.com" className="text-gaming-accent hover:text-gaming-accent/80 transition-colors">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}