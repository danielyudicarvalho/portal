/**
 * Service Worker notification event handlers
 * This code should be included in the service worker file
 */

import { NotificationManager } from './notification-manager';

// Service worker types
interface ServiceWorkerGlobalScope {
  registration: ServiceWorkerRegistration;
  addEventListener(type: string, listener: (event: any) => void): void;
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Handle notification click events in service worker
 */
self.addEventListener('notificationclick', (event: any) => {
  const notificationManager = NotificationManager.getInstance();
  notificationManager.handleNotificationClick(event);
});

/**
 * Handle notification close events
 */
self.addEventListener('notificationclose', (event: any) => {
  // Track notification close events for analytics
  console.log('Notification closed:', event.notification.tag);
});

/**
 * Handle push events (for server-sent push notifications)
 */
self.addEventListener('push', (event: any) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    
    const notificationOptions: NotificationOptions & { actions?: any[] } = {
      body: data.body || 'New notification',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      tag: data.tag || 'default',
      data: data.data || {},
      requireInteraction: data.requireInteraction || false,
    };

    if (data.actions) {
      notificationOptions.actions = data.actions;
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Game Portal', notificationOptions)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Game Portal', {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
      })
    );
  }
});

/**
 * Handle background sync for notification-related tasks
 */
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

/**
 * Sync notification subscriptions and pending notifications
 */
async function syncNotifications(): Promise<void> {
  try {
    // Check if subscription is still valid
    const subscription = await self.registration.pushManager.getSubscription();
    
    if (subscription) {
      // Send subscription to server for validation
      // This would typically involve an API call to your backend
      console.log('Syncing notification subscription:', subscription.endpoint);
    }
    
    // Handle any pending notifications stored in IndexedDB
    // This is where you would implement offline notification queuing
    
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}

export {};