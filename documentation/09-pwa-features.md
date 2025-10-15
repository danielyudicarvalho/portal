# Progressive Web App (PWA) Features

## 📱 Overview

Game Portal is built as a Progressive Web App (PWA), providing a native app-like experience across all devices and platforms. The PWA implementation includes offline functionality, installability, push notifications, and mobile optimizations that enhance user engagement and accessibility.

## 🎯 PWA Core Features

### App Shell Architecture

The application uses an app shell model for optimal performance:

```
┌─────────────────────────────────────────────────────────────┐
│                    App Shell (Cached)                      │
├─────────────────────────────────────────────────────────────┤
│  Navigation Header  │  Layout Components  │  Core UI       │
│  - Logo & Branding  │  - Sidebar         │  - Buttons     │
│  - Main Navigation  │  - Footer          │  - Modals      │
│  - User Menu        │  - Loading States  │  - Forms       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Dynamic Content (Network)                   │
├─────────────────────────────────────────────────────────────┤
│  Game Data      │  User Content     │  Real-time Updates   │
│  - Game List    │  - Profile Info   │  - Multiplayer      │
│  - Game Assets  │  - Favorites      │  - Notifications    │
│  - Thumbnails   │  - History        │  - Live Scores      │
└─────────────────────────────────────────────────────────────┘
```

### Service Worker Implementation

#### Service Worker Registration
```typescript
// src/lib/pwa.ts
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              showUpdateNotification();
            }
          });
        }
      });

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};
```

#### Caching Strategies
```javascript
// Service Worker caching strategies
const CACHE_STRATEGIES = {
  // App Shell - Cache First
  appShell: {
    pattern: /^https?.*\/_next\/static\/.*/,
    strategy: 'CacheFirst',
    cacheName: 'app-shell-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    },
  },

  // Game Assets - Stale While Revalidate
  gameAssets: {
    pattern: /^https?.*\/games\/.*/,
    strategy: 'StaleWhileRevalidate',
    cacheName: 'game-assets-cache',
    expiration: {
      maxEntries: 500,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    },
  },

  // API Calls - Network First
  apiCalls: {
    pattern: /^https?.*\/api\/.*/,
    strategy: 'NetworkFirst',
    cacheName: 'api-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 5 * 60, // 5 minutes
    },
    networkTimeoutSeconds: 3,
  },

  // Images - Cache First
  images: {
    pattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
    strategy: 'CacheFirst',
    cacheName: 'images-cache',
    expiration: {
      maxEntries: 200,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    },
  },
};
```

## 📲 Installation & App Manifest

### Web App Manifest

#### Manifest Configuration
```json
{
  "name": "Game Portal",
  "short_name": "GamePortal",
  "description": "A collection of fun and engaging browser games to play online",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1f2937",
  "theme_color": "#3b82f6",
  "orientation": "any",
  "scope": "/",
  "lang": "en",
  "categories": ["games", "entertainment"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/images/screenshot-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Game Portal - Browse and play games"
    },
    {
      "src": "/images/screenshot-narrow.png",
      "sizes": "640x1136",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Game Portal - Mobile gaming experience"
    }
  ],
  "shortcuts": [
    {
      "name": "Play Games",
      "short_name": "Games",
      "description": "Browse and play games",
      "url": "/games",
      "icons": [
        {
          "src": "/icons/shortcut-games.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Multiplayer",
      "short_name": "Multiplayer",
      "description": "Join multiplayer games",
      "url": "/games?filter=multiplayer",
      "icons": [
        {
          "src": "/icons/shortcut-multiplayer.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false
}
```

### Installation Prompts

#### Custom Install Prompt
```typescript
// src/hooks/usePWAInstallation.ts
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstallation = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
};
```

#### Install Button Component
```typescript
// src/components/ui/InstallButton.tsx
import React from 'react';
import { usePWAInstallation } from '@/hooks/usePWAInstallation';

export const InstallButton: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstallation();

  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      // Track installation
      gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'user_initiated'
      });
    }
  };

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Install App
    </button>
  );
};
```

## 🔄 Offline Functionality

### Offline Detection

#### Network Status Hook
```typescript
// src/hooks/usePWAOfflineState.ts
import { useState, useEffect } from 'react';

export const usePWAOfflineState = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Show reconnection notification
        showNotification('Back online! Syncing data...', 'success');
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      showNotification('You are offline. Some features may be limited.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};
```

#### Offline Indicator Component
```typescript
// src/components/ui/OfflineIndicator.tsx
import React from 'react';
import { usePWAOfflineState } from '@/hooks/usePWAOfflineState';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWAOfflineState();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-50">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        You're offline. Some features may be limited.
      </div>
    </div>
  );
};
```

### Offline Game Support

#### Offline Games Hook
```typescript
// src/hooks/useOfflineGames.ts
import { useState, useEffect } from 'react';
import { GameData } from '@/types';

export const useOfflineGames = () => {
  const [offlineGames, setOfflineGames] = useState<GameData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOfflineGames();
  }, []);

  const loadOfflineGames = async () => {
    try {
      // Check cache for offline-capable games
      const cache = await caches.open('game-assets-cache');
      const cachedRequests = await cache.keys();
      
      const offlineGameSlugs = cachedRequests
        .map(request => {
          const match = request.url.match(/\/games\/([^\/]+)\//);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      // Load game metadata from local storage or cache
      const games = await Promise.all(
        offlineGameSlugs.map(async (slug) => {
          const gameData = localStorage.getItem(`game-${slug}`);
          return gameData ? JSON.parse(gameData) : null;
        })
      );

      setOfflineGames(games.filter(Boolean));
    } catch (error) {
      console.error('Failed to load offline games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cacheGameForOffline = async (game: GameData) => {
    try {
      // Cache game assets
      const cache = await caches.open('game-assets-cache');
      await cache.add(`/games/${game.slug}/`);
      
      // Store game metadata
      localStorage.setItem(`game-${game.slug}`, JSON.stringify(game));
      
      // Update offline games list
      setOfflineGames(prev => [...prev, game]);
      
      return true;
    } catch (error) {
      console.error('Failed to cache game:', error);
      return false;
    }
  };

  return {
    offlineGames,
    isLoading,
    cacheGameForOffline,
  };
};
```

#### Offline Game Component
```typescript
// src/components/features/OfflineGamesList.tsx
import React from 'react';
import { useOfflineGames } from '@/hooks/useOfflineGames';
import { GameCard } from '@/components/ui/GameCard';

export const OfflineGamesList: React.FC = () => {
  const { offlineGames, isLoading } = useOfflineGames();

  if (isLoading) {
    return <div className="text-center py-8">Loading offline games...</div>;
  }

  if (offlineGames.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">No Offline Games</h3>
        <p className="text-gray-600">
          Play games while online to cache them for offline use.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Available Offline</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offlineGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            showOfflineIndicator
          />
        ))}
      </div>
    </div>
  );
};
```

### Background Sync

#### Background Sync Implementation
```typescript
// src/lib/background-sync.ts
export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private syncQueue: Array<{ id: string; data: any; endpoint: string }> = [];

  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  async queueSync(id: string, data: any, endpoint: string): Promise<void> {
    const syncItem = { id, data, endpoint, timestamp: Date.now() };
    
    // Store in IndexedDB for persistence
    await this.storeInIndexedDB(syncItem);
    
    // Add to memory queue
    this.syncQueue.push(syncItem);
    
    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(`sync-${id}`);
    } else {
      // Fallback: attempt sync immediately
      this.attemptSync();
    }
  }

  private async attemptSync(): Promise<void> {
    if (!navigator.onLine) return;

    const pendingItems = await this.getPendingItems();
    
    for (const item of pendingItems) {
      try {
        await fetch(item.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        
        // Remove from queue on success
        await this.removeFromIndexedDB(item.id);
        this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
        
      } catch (error) {
        console.error(`Sync failed for ${item.id}:`, error);
      }
    }
  }

  private async storeInIndexedDB(item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GamePortalSync', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        store.put(item);
        transaction.oncomplete = () => resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      };
    });
  }
}
```

## 🔔 Push Notifications

### Notification Permission

#### Notification Manager
```typescript
// src/lib/notification-manager.ts
export class NotificationManager {
  private static instance: NotificationManager;
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'game-portal',
      renotify: true,
      ...options,
    };

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, defaultOptions);
    } else {
      new Notification(title, defaultOptions);
    }
  }

  async scheduleNotification(title: string, options: NotificationOptions, delay: number): Promise<void> {
    setTimeout(() => {
      this.showNotification(title, options);
    }, delay);
  }
}
```

#### Notification Hook
```typescript
// src/hooks/useNotifications.ts
import { useState, useEffect } from 'react';
import { NotificationManager } from '@/lib/notification-manager';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    const manager = NotificationManager.getInstance();
    const result = await manager.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const showNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
    const manager = NotificationManager.getInstance();
    await manager.showNotification(title, options);
  };

  const showGameNotification = async (type: 'invite' | 'turn' | 'win' | 'achievement', data: any): Promise<void> => {
    const notifications = {
      invite: {
        title: 'Game Invitation',
        body: `${data.playerName} invited you to play ${data.gameName}`,
        icon: '/icons/notification-invite.png',
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' }
        ]
      },
      turn: {
        title: 'Your Turn',
        body: `It's your turn in ${data.gameName}`,
        icon: '/icons/notification-turn.png',
        tag: 'turn-notification'
      },
      win: {
        title: 'Victory!',
        body: `You won in ${data.gameName}! Score: ${data.score}`,
        icon: '/icons/notification-win.png',
        vibrate: [300, 100, 300, 100, 300]
      },
      achievement: {
        title: 'Achievement Unlocked!',
        body: data.achievementName,
        icon: '/icons/notification-achievement.png',
        vibrate: [200, 100, 200]
      }
    };

    await showNotification(notifications[type].title, notifications[type]);
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showGameNotification,
  };
};
```

### Push Notification Service

#### Service Worker Push Handler
```javascript
// public/sw.js - Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, badge, actions, tag } = data;

  const options = {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/badge-72x72.png',
    tag: tag || 'game-portal',
    vibrate: [200, 100, 200],
    actions: actions || [],
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, data } = event;
  
  if (action === 'accept' && data.type === 'game_invite') {
    // Handle game invitation acceptance
    event.waitUntil(
      clients.openWindow(`/games/${data.gameSlug}/room/${data.roomId}`)
    );
  } else if (action === 'decline' && data.type === 'game_invite') {
    // Handle game invitation decline
    fetch('/api/multiplayer/decline-invite', {
      method: 'POST',
      body: JSON.stringify({ inviteId: data.inviteId }),
    });
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  }
});
```

## 📱 Mobile Optimizations

### Touch Input Handling

#### Touch Input Adapter
```typescript
// src/lib/touch-input-adapter.ts
export class TouchInputAdapter {
  private touchStartPos: { x: number; y: number } | null = null;
  private touchMoveThreshold = 10;
  private tapTimeout: NodeJS.Timeout | null = null;

  constructor(private element: HTMLElement) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Prevent default touch behaviors
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Prevent context menu on long press
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    const touch = event.touches[0];
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };
    
    // Handle long press
    this.tapTimeout = setTimeout(() => {
      this.onLongPress?.(this.touchStartPos!);
    }, 500);
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    if (!this.touchStartPos) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.touchStartPos.x;
    const deltaY = touch.clientY - this.touchStartPos.y;
    
    // Cancel long press on movement
    if (this.tapTimeout && (Math.abs(deltaX) > this.touchMoveThreshold || Math.abs(deltaY) > this.touchMoveThreshold)) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
    }
    
    // Handle swipe gestures
    this.onSwipe?.(deltaX, deltaY);
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
      
      // Handle tap
      this.onTap?.(this.touchStartPos!);
    }
    
    this.touchStartPos = null;
  }

  // Event callbacks (set by consumers)
  onTap?: (position: { x: number; y: number }) => void;
  onLongPress?: (position: { x: number; y: number }) => void;
  onSwipe?: (deltaX: number, deltaY: number) => void;
}
```

#### Touch Input Hook
```typescript
// src/hooks/useTouchInputAdapter.ts
import { useEffect, useRef } from 'react';
import { TouchInputAdapter } from '@/lib/touch-input-adapter';

interface TouchInputCallbacks {
  onTap?: (position: { x: number; y: number }) => void;
  onLongPress?: (position: { x: number; y: number }) => void;
  onSwipe?: (deltaX: number, deltaY: number) => void;
}

export const useTouchInputAdapter = (callbacks: TouchInputCallbacks) => {
  const elementRef = useRef<HTMLElement>(null);
  const adapterRef = useRef<TouchInputAdapter | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    adapterRef.current = new TouchInputAdapter(elementRef.current);
    
    // Set callbacks
    adapterRef.current.onTap = callbacks.onTap;
    adapterRef.current.onLongPress = callbacks.onLongPress;
    adapterRef.current.onSwipe = callbacks.onSwipe;

    return () => {
      adapterRef.current = null;
    };
  }, [callbacks]);

  return elementRef;
};
```

### Orientation Handling

#### Orientation Manager
```typescript
// src/lib/orientation-manager.ts
export class OrientationManager {
  private static instance: OrientationManager;
  private currentOrientation: OrientationType = 'portrait-primary';
  private listeners: Array<(orientation: OrientationType) => void> = [];

  static getInstance(): OrientationManager {
    if (!OrientationManager.instance) {
      OrientationManager.instance = new OrientationManager();
    }
    return OrientationManager.instance;
  }

  constructor() {
    this.setupOrientationListener();
  }

  private setupOrientationListener(): void {
    if ('screen' in window && 'orientation' in window.screen) {
      window.screen.orientation.addEventListener('change', () => {
        this.currentOrientation = window.screen.orientation.type;
        this.notifyListeners();
      });
    } else {
      // Fallback for older browsers
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.detectOrientation();
          this.notifyListeners();
        }, 100);
      });
    }
  }

  private detectOrientation(): void {
    const { innerWidth, innerHeight } = window;
    if (innerWidth > innerHeight) {
      this.currentOrientation = 'landscape-primary';
    } else {
      this.currentOrientation = 'portrait-primary';
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentOrientation));
  }

  getCurrentOrientation(): OrientationType {
    return this.currentOrientation;
  }

  isLandscape(): boolean {
    return this.currentOrientation.includes('landscape');
  }

  isPortrait(): boolean {
    return this.currentOrientation.includes('portrait');
  }

  async lockOrientation(orientation: OrientationLockType): Promise<boolean> {
    if ('screen' in window && 'orientation' in window.screen && 'lock' in window.screen.orientation) {
      try {
        await window.screen.orientation.lock(orientation);
        return true;
      } catch (error) {
        console.warn('Orientation lock failed:', error);
        return false;
      }
    }
    return false;
  }

  async unlockOrientation(): Promise<void> {
    if ('screen' in window && 'orientation' in window.screen && 'unlock' in window.screen.orientation) {
      window.screen.orientation.unlock();
    }
  }

  addListener(listener: (orientation: OrientationType) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}
```

#### Orientation Hook
```typescript
// src/hooks/useOrientation.ts
import { useState, useEffect } from 'react';
import { OrientationManager } from '@/lib/orientation-manager';

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<OrientationType>('portrait-primary');
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const manager = OrientationManager.getInstance();
    
    // Set initial orientation
    setOrientation(manager.getCurrentOrientation());
    setIsLandscape(manager.isLandscape());
    
    // Listen for changes
    const unsubscribe = manager.addListener((newOrientation) => {
      setOrientation(newOrientation);
      setIsLandscape(newOrientation.includes('landscape'));
    });

    return unsubscribe;
  }, []);

  const lockOrientation = async (lockType: OrientationLockType): Promise<boolean> => {
    const manager = OrientationManager.getInstance();
    return await manager.lockOrientation(lockType);
  };

  const unlockOrientation = async (): Promise<void> => {
    const manager = OrientationManager.getInstance();
    await manager.unlockOrientation();
  };

  return {
    orientation,
    isLandscape,
    isPortrait: !isLandscape,
    lockOrientation,
    unlockOrientation,
  };
};
```

## 📊 PWA Analytics

### Installation Tracking

#### Installation Analytics
```typescript
// src/lib/pwa-analytics.ts
export class PWAAnalytics {
  private static instance: PWAAnalytics;

  static getInstance(): PWAAnalytics {
    if (!PWAAnalytics.instance) {
      PWAAnalytics.instance = new PWAAnalytics();
    }
    return PWAAnalytics.instance;
  }

  trackInstallPromptShown(): void {
    this.trackEvent('pwa_install_prompt_shown', {
      event_category: 'pwa',
      event_label: 'install_prompt'
    });
  }

  trackInstallPromptAccepted(): void {
    this.trackEvent('pwa_install_prompt_accepted', {
      event_category: 'pwa',
      event_label: 'install_accepted'
    });
  }

  trackInstallPromptDismissed(): void {
    this.trackEvent('pwa_install_prompt_dismissed', {
      event_category: 'pwa',
      event_label: 'install_dismissed'
    });
  }

  trackAppInstalled(): void {
    this.trackEvent('pwa_app_installed', {
      event_category: 'pwa',
      event_label: 'app_installed'
    });
  }

  trackOfflineUsage(gameSlug?: string): void {
    this.trackEvent('pwa_offline_usage', {
      event_category: 'pwa',
      event_label: 'offline_usage',
      custom_parameters: {
        game_slug: gameSlug || 'general'
      }
    });
  }

  trackNotificationPermission(granted: boolean): void {
    this.trackEvent('pwa_notification_permission', {
      event_category: 'pwa',
      event_label: granted ? 'granted' : 'denied'
    });
  }

  private trackEvent(eventName: string, parameters: any): void {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }

    // Custom analytics endpoint
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        parameters,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(error => {
      console.error('Analytics tracking failed:', error);
    });
  }
}
```

### Performance Monitoring

#### PWA Performance Metrics
```typescript
// src/lib/pwa-performance.ts
export class PWAPerformanceMonitor {
  private static instance: PWAPerformanceMonitor;

  static getInstance(): PWAPerformanceMonitor {
    if (!PWAPerformanceMonitor.instance) {
      PWAPerformanceMonitor.instance = new PWAPerformanceMonitor();
    }
    return PWAPerformanceMonitor.instance;
  }

  measureAppShellLoad(): void {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.navigationStart
      };

      this.reportMetrics('app_shell_load', metrics);
    }
  }

  measureCachePerformance(): void {
    if ('caches' in window) {
      const startTime = performance.now();
      
      caches.open('app-shell-cache').then(cache => {
        const endTime = performance.now();
        const cacheAccessTime = endTime - startTime;
        
        this.reportMetrics('cache_access', {
          access_time: cacheAccessTime
        });
      });
    }
  }

  measureOfflineCapability(): void {
    const offlineCapabilities = {
      serviceWorker: 'serviceWorker' in navigator,
      cacheAPI: 'caches' in window,
      indexedDB: 'indexedDB' in window,
      localStorage: 'localStorage' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };

    this.reportMetrics('offline_capabilities', offlineCapabilities);
  }

  private reportMetrics(type: string, metrics: any): void {
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        metrics,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.error('Performance reporting failed:', error);
    });
  }
}
```

## 🔧 PWA Development Tools

### PWA Validation

#### PWA Checklist Component
```typescript
// src/components/admin/PWAChecklist.tsx
import React, { useState, useEffect } from 'react';

interface PWACheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export const PWAChecklist: React.FC = () => {
  const [checks, setChecks] = useState<PWACheck[]>([]);

  useEffect(() => {
    runPWAChecks();
  }, []);

  const runPWAChecks = async (): Promise<void> => {
    const results: PWACheck[] = [];

    // Check service worker
    results.push({
      name: 'Service Worker',
      status: 'serviceWorker' in navigator ? 'pass' : 'fail',
      message: 'serviceWorker' in navigator ? 'Service Worker supported' : 'Service Worker not supported'
    });

    // Check manifest
    try {
      const response = await fetch('/manifest.json');
      results.push({
        name: 'Web App Manifest',
        status: response.ok ? 'pass' : 'fail',
        message: response.ok ? 'Manifest file accessible' : 'Manifest file not found'
      });
    } catch {
      results.push({
        name: 'Web App Manifest',
        status: 'fail',
        message: 'Failed to fetch manifest'
      });
    }

    // Check HTTPS
    results.push({
      name: 'HTTPS',
      status: location.protocol === 'https:' || location.hostname === 'localhost' ? 'pass' : 'fail',
      message: location.protocol === 'https:' ? 'Site served over HTTPS' : 'Site must be served over HTTPS'
    });

    // Check installability
    results.push({
      name: 'Installable',
      status: 'BeforeInstallPromptEvent' in window ? 'pass' : 'warning',
      message: 'Install prompt availability varies by browser'
    });

    setChecks(results);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">PWA Validation</h3>
      <div className="space-y-2">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className={`w-3 h-3 rounded-full ${
              check.status === 'pass' ? 'bg-green-500' :
              check.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <div className="flex-1">
              <div className="font-medium">{check.name}</div>
              <div className="text-sm text-gray-600">{check.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

This comprehensive PWA documentation covers all aspects of the Progressive Web App implementation in Game Portal, providing developers with the knowledge needed to maintain and extend the PWA features effectively.