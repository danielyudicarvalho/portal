'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ConnectionError, RoomJoinError } from '@/lib/room-service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  gameId?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorType: 'connection' | 'room' | 'generic' | null;
}

export class RoomErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorType: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Determine error type based on error properties
    let errorType: 'connection' | 'room' | 'generic' = 'generic';
    
    if ('code' in error) {
      const errorCode = (error as any).code;
      if (errorCode?.includes('CONNECTION') || errorCode?.includes('NETWORK')) {
        errorType = 'connection';
      } else if (errorCode?.includes('ROOM')) {
        errorType = 'room';
      }
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log error for debugging
    this.logRoomError(error, errorInfo);
  }

  private logRoomError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      gameId: this.props.gameId,
      errorType: this.state.errorType,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    // Store error in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('room-errors') || '[]');
      existingErrors.push(errorData);
      // Keep only last 20 errors
      if (existingErrors.length > 20) {
        existingErrors.shift();
      }
      localStorage.setItem('room-errors', JSON.stringify(existingErrors));
    } catch (e) {
      console.error('Failed to store room error data:', e);
    }

    console.error('Room Error Boundary caught an error:', errorData);
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorType: null,
        retryCount: prevState.retryCount + 1,
      }));

      // Call custom retry handler if provided
      if (this.props.onRetry) {
        this.props.onRetry();
      }

      // Add a small delay before retry to prevent immediate re-error
      this.retryTimeout = setTimeout(() => {
        this.forceUpdate();
      }, 1000);
    }
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoBack = () => {
    if (this.props.onGoBack) {
      this.props.onGoBack();
    } else if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/games';
      }
    }
  };

  private getErrorMessage(): { title: string; description: string; icon: string } {
    const { error, errorType } = this.state;
    
    if (!error) {
      return {
        title: 'Something went wrong',
        description: 'An unexpected error occurred.',
        icon: 'exclamation-triangle'
      };
    }

    // Handle specific room errors
    if ('code' in error) {
      const roomError = error as RoomJoinError;
      switch (roomError.code) {
        case 'ROOM_FULL':
          return {
            title: 'Room is Full',
            description: 'This room has reached its maximum capacity. Try joining another room or create a new one.',
            icon: 'users'
          };
        case 'ROOM_NOT_FOUND':
          return {
            title: 'Room Not Found',
            description: 'The room you\'re trying to join doesn\'t exist or has been closed.',
            icon: 'search'
          };
        case 'ROOM_CLOSED':
          return {
            title: 'Room Closed',
            description: 'This room has been closed by the host.',
            icon: 'lock'
          };
        case 'INVALID_ROOM_STATE':
          return {
            title: 'Room Unavailable',
            description: 'This room is currently in a state that doesn\'t allow new players to join.',
            icon: 'clock'
          };
        case 'CONNECTION_FAILED':
          return {
            title: 'Connection Failed',
            description: 'Unable to connect to the multiplayer server. Please check your internet connection.',
            icon: 'wifi-slash'
          };
        case 'PERMISSION_DENIED':
          return {
            title: 'Access Denied',
            description: 'You don\'t have permission to join this room.',
            icon: 'shield-exclamation'
          };
      }
    }

    // Handle connection errors
    if (errorType === 'connection') {
      return {
        title: 'Connection Problem',
        description: 'Unable to connect to the multiplayer server. Please check your internet connection and try again.',
        icon: 'wifi-slash'
      };
    }

    // Handle room-specific errors
    if (errorType === 'room') {
      return {
        title: 'Room Error',
        description: 'There was a problem with the room operation. Please try again.',
        icon: 'home'
      };
    }

    // Generic error
    return {
      title: this.props.gameId ? 'Game Error' : 'Something went wrong',
      description: this.props.gameId 
        ? 'The game encountered an error and cannot continue.'
        : 'An unexpected error occurred while loading this page.',
      icon: 'exclamation-triangle'
    };
  }

  private getErrorIcon(iconName: string): ReactNode {
    const iconClass = "w-8 h-8 text-red-600";
    
    switch (iconName) {
      case 'users':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case 'search':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'lock':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'clock':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'wifi-slash':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M18.364 5.636l-12.728 12.728m0 0L2.05 14.778m3.586 3.586l12.728-12.728M8.111 16.889L12 13m6.364-7.364L12 12" />
          </svg>
        );
      case 'shield-exclamation':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
          </svg>
        );
      case 'home':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const errorInfo = this.getErrorMessage();
      const roomError = this.state.error as RoomJoinError;
      const hasAlternatives = roomError?.alternatives && roomError.alternatives.length > 0;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md mx-auto text-center">
            <div className="p-6">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  {this.getErrorIcon(errorInfo.icon)}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {errorInfo.title}
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  {errorInfo.description}
                </p>
              </div>

              {/* Show alternatives for room full errors */}
              {hasAlternatives && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2 font-medium">
                    Try these similar rooms instead:
                  </p>
                  <div className="space-y-1">
                    {roomError.alternatives!.slice(0, 2).map((alt, index) => (
                      <div key={alt.roomId} className="text-xs text-blue-700">
                        Room {alt.roomCode} ({alt.playerCount}/{alt.maxPlayers} players)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="primary"
                  >
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                )}

                {this.props.gameId && (
                  <Button
                    onClick={this.handleGoBack}
                    className="w-full"
                    variant="secondary"
                  >
                    Back to Games
                  </Button>
                )}

                <Button
                  onClick={this.handleReload}
                  className="w-full"
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                    {'\n\nError Type: '}
                    {this.state.errorType}
                    {roomError?.code && '\nError Code: ' + roomError.code}
                  </pre>
                </details>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RoomErrorBoundary;