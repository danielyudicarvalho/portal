'use client';

import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function VerifyRequestPage() {
  const router = useRouter();

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
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gaming-success to-gaming-secondary rounded-full mb-6 shadow-lg animate-pulse">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5 1.41-1.41L9 14.17l9.59-9.59L20 6z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white font-gaming mb-2">Check Your Email</h1>
          <p className="text-gaming-secondary/80">We've sent you a magic link!</p>
        </div>

        <Card variant="gaming" className="backdrop-blur-sm bg-gaming-dark/80 border-gaming-accent/30">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-gaming-success/10 border border-gaming-success/30 rounded-lg">
                <svg className="w-12 h-12 text-gaming-success mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <h3 className="text-lg font-semibold text-white mb-2">Email Sent Successfully!</h3>
                <p className="text-white/70 text-sm">
                  We've sent a secure sign-in link to your email address. 
                  Click the link in your email to complete the sign-in process.
                </p>
              </div>

              <div className="bg-gaming-dark/50 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-2">What's next?</h4>
                <ul className="text-white/70 text-sm space-y-1 text-left">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-gaming-accent rounded-full"></span>
                    <span>Check your email inbox</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-gaming-accent rounded-full"></span>
                    <span>Click the "Sign in to Game Portal" link</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-gaming-accent rounded-full"></span>
                    <span>You'll be automatically signed in</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/')}
                variant="primary"
                size="lg"
                className="w-full bg-gradient-to-r from-gaming-accent to-gaming-secondary hover:from-gaming-accent/90 hover:to-gaming-secondary/90"
              >
                Return to Game Portal
              </Button>
              
              <Button
                onClick={() => router.push('/auth/signin')}
                variant="ghost"
                size="md"
                className="w-full text-white/70 hover:text-white hover:bg-white/5"
              >
                Try a different email
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-white/50 text-xs">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}