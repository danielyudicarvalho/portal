/**
 * Offline Handler - Manages offline detection and reconnection logic
 */

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  offlineSince: number | null;
  reconnectAttempts: number;
  lastOnlineTime: number;
}

export interface OfflineHandlerOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  onReconnectAttempt?: (attempt: number) => void;
  onReconnectSuccess?: () => void;
  onReconnectFailed?: (error: Error) => void;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
  pingTimeout?: number;
  pingUrl?: string;
}

export class OfflineHandler {
  private state: OfflineState = {
    isOnline: navigator.onLine,
    wasOffline: false,
    offlineSince: null,
    reconnectAttempts: 0,
    lastOnlineTime: Date.now(),
  };

  private options: Required<OfflineHandlerOptions>;
  private listeners: Array<(state: OfflineState) => void> = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;

  constructor(options: OfflineHandlerOptions = {}) {
    this.options = {
      onOnline: () => {},
      onOffline: () => {},
      onReconnectAttempt: () => {},
      onReconnectSuccess: () => {},
      onReconnectFailed: () => {},
      maxReconnectAttempts: 5,
      reconnectDelay: 2000,
      pingInterval: 30000, // 30 seconds
      pingTimeout: 5000,   // 5 seconds
      pingUrl: '/api/ping',
      ...options,
    };

    this.initialize();
  }

  private initialize(): void {
    // Listen to browser online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Start periodic connectivity checks
    this.startPingInterval();

    // Initial state check
    this.checkConnectivity();
  }

  private handleOnline = (): void => {
    console.log('🌐 Browser reports online');
    this.checkConnectivity();
  };

  private handleOffline = (): void => {
    console.log('🌐 Browser reports offline');
    this.setOfflineState();
  };

  private startPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.state.isOnline) {
        this.checkConnectivity();
      }
    }, this.options.pingInterval);
  }

  private async checkConnectivity(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.pingTimeout);

      const response = await fetch(this.options.pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.setOnlineState();
      } else {
        throw new Error(`Ping failed with status: ${response.status}`);
      }
    } catch (error) {
      console.warn('Connectivity check failed:', error);
      this.setOfflineState();
    }
  }

  private setOnlineState(): void {
    const wasOffline = !this.state.isOnline;
    
    this.state = {
      ...this.state,
      isOnline: true,
      wasOffline: this.state.wasOffline || wasOffline,
      offlineSince: null,
      lastOnlineTime: Date.now(),
    };

    if (wasOffline) {
      console.log('🟢 Connection restored');
      this.state.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.options.onOnline();
      this.options.onReconnectSuccess();
    }

    this.notifyListeners();
  }

  private setOfflineState(): void {
    const wasOnline = this.state.isOnline;
    
    this.state = {
      ...this.state,
      isOnline: false,
      wasOffline: true,
      offlineSince: wasOnline ? Date.now() : this.state.offlineSince,
    };

    if (wasOnline) {
      console.log('🔴 Connection lost');
      this.options.onOffline();
      this.scheduleReconnect();
    }

    this.notifyListeners();
  }

  private scheduleReconnect(): void {
    if (this.isReconnecting || this.state.reconnectAttempts >= this.options.maxReconnectAttempts) {
      if (this.state.reconnectAttempts >= this.options.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.options.onReconnectFailed(new Error('Maximum reconnection attempts exceeded'));
      }
      return;
    }

    this.isReconnecting = true;
    const delay = this.options.reconnectDelay * Math.pow(2, this.state.reconnectAttempts);
    
    console.log(`🔄 Scheduling reconnect attempt ${this.state.reconnectAttempts + 1} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(async () => {
      this.state.reconnectAttempts++;
      this.isReconnecting = false;
      
      this.options.onReconnectAttempt(this.state.reconnectAttempts);
      
      try {
        await this.checkConnectivity();
        
        if (!this.state.isOnline) {
          this.scheduleReconnect();
        }
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
        this.scheduleReconnect();
      }
    }, delay);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in offline state listener:', error);
      }
    });
  }

  // Public API
  public getState(): OfflineState {
    return { ...this.state };
  }

  public isOnline(): boolean {
    return this.state.isOnline;
  }

  public isOffline(): boolean {
    return !this.state.isOnline;
  }

  public wasOffline(): boolean {
    return this.state.wasOffline;
  }

  public getOfflineDuration(): number {
    if (!this.state.offlineSince) return 0;
    return Date.now() - this.state.offlineSince;
  }

  public getReconnectAttempts(): number {
    return this.state.reconnectAttempts;
  }

  public subscribe(listener: (state: OfflineState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async forceReconnect(): Promise<void> {
    console.log('🔄 Force reconnect requested');
    this.state.reconnectAttempts = 0;
    this.isReconnecting = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    await this.checkConnectivity();
  }

  public clearOfflineState(): void {
    this.state.wasOffline = false;
    this.notifyListeners();
  }

  public dispose(): void {
    // Clear intervals and timeouts
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Remove event listeners
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    // Clear listeners
    this.listeners = [];
  }
}

// React hook for using offline handler
import { useState, useEffect, useRef } from 'react';

export const useOfflineHandler = (options: OfflineHandlerOptions = {}) => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    offlineSince: null,
    reconnectAttempts: 0,
    lastOnlineTime: Date.now(),
  });

  const handlerRef = useRef<OfflineHandler | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    handlerRef.current = new OfflineHandler({
      ...options,
      onOnline: () => {
        options.onOnline?.();
      },
      onOffline: () => {
        options.onOffline?.();
      },
      onReconnectAttempt: (attempt) => {
        options.onReconnectAttempt?.(attempt);
      },
      onReconnectSuccess: () => {
        options.onReconnectSuccess?.();
      },
      onReconnectFailed: (error) => {
        options.onReconnectFailed?.(error);
      },
    });

    const unsubscribe = handlerRef.current.subscribe(setOfflineState);

    return () => {
      unsubscribe();
      handlerRef.current?.dispose();
    };
  }, []);

  const forceReconnect = async () => {
    if (handlerRef.current) {
      await handlerRef.current.forceReconnect();
    }
  };

  const clearOfflineState = () => {
    if (handlerRef.current) {
      handlerRef.current.clearOfflineState();
    }
  };

  return {
    ...offlineState,
    forceReconnect,
    clearOfflineState,
  };
};