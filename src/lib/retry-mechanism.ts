/**
 * Retry Mechanism Utility
 * Provides configurable retry logic for failed operations
 */

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxAttemptsReached?: (error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export class RetryMechanism {
  private static defaultOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    retryCondition: (error: Error) => {
      // Default: retry on network/connection errors
      const message = error.message.toLowerCase();
      const code = 'code' in error ? (error as any).code : '';
      
      return (
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('timeout') ||
        code.includes('CONNECTION') ||
        code.includes('NETWORK') ||
        code.includes('TIMEOUT')
      );
    },
  };

  /**
   * Execute a function with retry logic
   */
  static async execute<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error;
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      attempt++;
      
      try {
        const result = await operation();
        return {
          success: true,
          result,
          attempts: attempt,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry this error
        if (!config.retryCondition!(lastError)) {
          break;
        }
        
        // If this is the last attempt, don't wait
        if (attempt >= config.maxAttempts) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        );
        
        // Call retry callback
        config.onRetry?.(attempt, lastError);
        
        // Wait before next attempt
        await this.delay(delay);
      }
    }

    // Max attempts reached
    config.onMaxAttemptsReached?.(lastError!);
    
    return {
      success: false,
      error: lastError!,
      attempts: attempt,
      totalTime: Date.now() - startTime,
    };
  }

  /**
   * Create a retry wrapper for a specific operation
   */
  static createRetryWrapper<T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    options: Partial<RetryOptions> = {}
  ) {
    return async (...args: T): Promise<R> => {
      const result = await this.execute(() => operation(...args), options);
      
      if (result.success) {
        return result.result!;
      } else {
        throw result.error;
      }
    };
  }

  /**
   * Utility function to create a delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Specific retry configurations for different operation types
 */
export const RetryConfigs = {
  // Connection operations (more aggressive retries)
  connection: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 1.5,
    retryCondition: (error: Error) => {
      const message = error.message.toLowerCase();
      const code = 'code' in error ? (error as any).code : '';
      
      return (
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('websocket') ||
        code.includes('CONNECTION') ||
        code.includes('NETWORK') ||
        code.includes('TIMEOUT') ||
        code.includes('WEBSOCKET')
      );
    },
  },

  // Room operations (moderate retries)
  roomOperation: {
    maxAttempts: 3,
    baseDelay: 1500,
    maxDelay: 8000,
    backoffFactor: 2,
    retryCondition: (error: Error) => {
      const code = 'code' in error ? (error as any).code : '';
      
      // Don't retry user errors or permanent failures
      const nonRetryableCodes = [
        'ROOM_FULL',
        'ROOM_NOT_FOUND',
        'PERMISSION_DENIED',
        'INVALID_ROOM_CODE',
        'VALIDATION_ERROR'
      ];
      
      if (nonRetryableCodes.some(nonRetryable => code.includes(nonRetryable))) {
        return false;
      }
      
      // Retry connection and temporary errors
      return (
        code.includes('CONNECTION') ||
        code.includes('TIMEOUT') ||
        code.includes('SERVER_ERROR') ||
        code.includes('TEMPORARY')
      );
    },
  },

  // Quick operations (fast retries)
  quickOperation: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffFactor: 2,
  },

  // Critical operations (persistent retries)
  critical: {
    maxAttempts: 10,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffFactor: 1.8,
  },
} as const;

/**
 * Convenience functions for common retry patterns
 */
export const retryConnection = <T>(operation: () => Promise<T>) =>
  RetryMechanism.execute(operation, RetryConfigs.connection);

export const retryRoomOperation = <T>(operation: () => Promise<T>) =>
  RetryMechanism.execute(operation, RetryConfigs.roomOperation);

export const retryQuickOperation = <T>(operation: () => Promise<T>) =>
  RetryMechanism.execute(operation, RetryConfigs.quickOperation);

export const retryCriticalOperation = <T>(operation: () => Promise<T>) =>
  RetryMechanism.execute(operation, RetryConfigs.critical);

/**
 * React hook for retry operations
 */
export const useRetry = () => {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastError, setLastError] = React.useState<Error | null>(null);

  const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> => {
    setIsRetrying(true);
    setRetryCount(0);
    setLastError(null);

    const config = {
      ...options,
      onRetry: (attempt: number, error: Error) => {
        setRetryCount(attempt);
        setLastError(error);
        options.onRetry?.(attempt, error);
      },
    };

    try {
      const result = await RetryMechanism.execute(operation, config);
      
      if (result.success) {
        return result.result!;
      } else {
        throw result.error;
      }
    } finally {
      setIsRetrying(false);
    }
  };

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    lastError,
  };
};

// Import React for the hook
import React from 'react';