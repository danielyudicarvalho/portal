'use client';

import React from 'react';
import { NotificationManager } from '../NotificationManager';

/**
 * Example component demonstrating NotificationManager usage
 */
export function NotificationManagerExample() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Push Notifications Demo</h2>
        <p className="text-gray-600">
          Test push notification functionality for the Game Portal PWA
        </p>
      </div>

      <NotificationManager 
        vapidPublicKey="your-vapid-public-key-here"
        showStats={true}
        className="w-full"
      />

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Click &quot;Enable Notifications&quot; to request permission</li>
          <li>2. Click &quot;Subscribe to Notifications&quot; to register for push notifications</li>
          <li>3. Click &quot;Send Test Notification&quot; to test the functionality</li>
          <li>4. Use &quot;Unsubscribe&quot; to stop receiving notifications</li>
        </ol>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Note:</h3>
        <p className="text-sm text-yellow-800">
          Push notifications require HTTPS and a valid VAPID key for production use.
          This demo shows the UI and permission flow.
        </p>
      </div>
    </div>
  );
}

export default NotificationManagerExample;