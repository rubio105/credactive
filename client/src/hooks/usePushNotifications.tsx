import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Only try to subscribe for authenticated patients (not doctors or admins)
    if (!user || (user as any).isDoctor || (user as any).isAdmin) {
      return;
    }

    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[Push] Browser does not support push notifications');
      return;
    }

    // Check current permission
    setPermission(Notification.permission);

    // Auto-subscribe if permission already granted
    if (Notification.permission === 'granted') {
      subscribeToPush();
    }
  }, [user]);

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        setIsSubscribed(true);
        console.log('[Push] Already subscribed');
        return;
      }

      // Fetch VAPID public key from backend
      const response = await fetch('/api/push/vapid-public-key');
      if (!response.ok) {
        console.warn('[Push] VAPID public key not available');
        return;
      }

      const { publicKey } = await response.json();

      // Convert base64 to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Save subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
            auth: btoa(String.fromCharCode(...Array.from(new Uint8Array(subscription.getKey('auth')!)))),
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      setIsSubscribed(true);
      console.log('[Push] Successfully subscribed to push notifications');
    } catch (error) {
      console.error('[Push] Failed to subscribe:', error);
    }
  };

  const requestPermission = async () => {
    if (Notification.permission === 'granted') {
      await subscribeToPush();
      return true;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await subscribeToPush();
      return true;
    }

    return false;
  };

  return {
    isSubscribed,
    permission,
    requestPermission,
  };
}
