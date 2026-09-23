/**
 * Powerhouse Notification Service
 * Handles Web Push, Service Worker notifications, audio chimes,
 * and scheduled announcement dispatch for mobile & desktop PWAs.
 */

import { Announcement } from '@/lib/types';
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from '@/lib/pushConfig';

const NOTIFIED_STORAGE_KEY = 'powerhouse_notified_announcements_v1';

import { getSupabaseClient, getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Check if the browser / mobile device supports notifications
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current notification permission
 */
export const getNotificationPermission = (): NotificationPermissionStatus => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionStatus;
};

/**
 * Helper to safely extract subscription JSON with keys
 */
const serializePushSubscription = (sub: PushSubscription): { endpoint: string; keys: { p256dh: string; auth: string } } | null => {
  try {
    const json = sub.toJSON();
    if (json.endpoint && json.keys && json.keys.p256dh && json.keys.auth) {
      return {
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth
        }
      };
    }

    // Fallback extraction via getKey
    const p256dhRaw = sub.getKey ? sub.getKey('p256dh') : null;
    const authRaw = sub.getKey ? sub.getKey('auth') : null;

    const p256dh = p256dhRaw
      ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhRaw))))
      : json.keys?.p256dh || '';
    const auth = authRaw
      ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authRaw))))
      : json.keys?.auth || '';

    if (sub.endpoint && p256dh && auth) {
      return {
        endpoint: sub.endpoint,
        keys: { p256dh, auth }
      };
    }
  } catch (err) {
    console.warn('[Push Client] Error serializing push subscription:', err);
  }
  return null;
};

/**
 * Register current device with the Web Push Server & Supabase Database
 * Enables receiving notifications sent from PC or other devices even when closed!
 */
export const registerPushSubscription = async (): Promise<boolean> => {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) return false;

    let sub = await reg.pushManager.getSubscription();

    if (!sub && Notification.permission === 'granted') {
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource
      });
    }

    if (sub) {
      const serialized = serializePushSubscription(sub);
      if (!serialized) {
        console.warn('[Push Client] Failed to serialize PushSubscription keys');
        return false;
      }

      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      const supabaseUrl = getSupabaseUrl();
      const supabaseAnonKey = getSupabaseAnonKey();

      // 1. Direct Supabase database persist (Client-side guarantees cross-device sync)
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { error: dbErr } = await supabase.from('push_subscriptions').upsert(
            {
              endpoint: serialized.endpoint,
              keys: serialized.keys,
              user_agent: navigator.userAgent,
              is_mobile: isMobile,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'endpoint' }
          );

          if (dbErr) {
            console.warn('[Push Client] Direct Supabase upsert error:', dbErr.message);
          } else {
            console.log(`[Push Client] Saved push subscription to Supabase (${isMobile ? 'Mobile' : 'Desktop'})`);
          }
        } catch (dbEx) {
          console.warn('[Push Client] Supabase upsert exception:', dbEx);
        }
      }

      // 2. Also register with server route /api/push/subscribe
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: serialized,
          deviceInfo: {
            userAgent: navigator.userAgent,
            isMobile
          },
          supabaseConfig: {
            url: supabaseUrl,
            anonKey: supabaseAnonKey
          }
        })
      });

      console.log(`[Push Client] Registered push subscription (${isMobile ? 'Mobile' : 'Desktop'})`);
      return true;
    }
  } catch (err) {
    console.warn('[Push Client] Failed to register push subscription:', err);
  }
  return false;
};

/**
 * Query active push devices count directly from Supabase / server
 */
export const getPushDeviceStats = async (): Promise<{ total: number; mobile: number }> => {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('push_subscriptions').select('endpoint, is_mobile');
      if (!error && Array.isArray(data)) {
        const mobileCount = data.filter((d: any) => d.is_mobile).length;
        return { total: data.length, mobile: mobileCount };
      }
    } catch (e) {}
  }

  // Fallback to server route
  try {
    const res = await fetch('/api/push/subscribe');
    const data = await res.json();
    if (data.success) {
      return { total: data.totalDevices || 0, mobile: data.mobileDevices || 0 };
    }
  } catch (e) {}

  return { total: 0, mobile: 0 };
};

/**
 * Broadcast a Web Push notification to ALL connected mobile devices via cloud (PC -> Mobile)
 */
export const sendPushNotificationToAllDevices = async (
  title: string,
  options: {
    body?: string;
    url?: string;
    tag?: string;
    isUrgent?: boolean;
  } = {}
): Promise<{ success: boolean; sentCount: number; mobileDevices: number; message: string }> => {
  try {
    // 1. Fetch all active subscriptions from Supabase directly so serverless statelessness never drops devices!
    let dbSubscriptions: any[] = [];
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('push_subscriptions').select('*');
        if (!error && Array.isArray(data)) {
          dbSubscriptions = data;
        }
      } catch (err) {
        console.warn('[Push Client] Failed fetching subscriptions from Supabase:', err);
      }
    }

    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body: options.body || '',
        url: options.url || '/',
        tag: options.tag || `push-${Date.now()}`,
        isUrgent: options.isUrgent ?? false,
        subscriptions: dbSubscriptions, // Passed directly from Supabase
        supabaseConfig: {
          url: supabaseUrl,
          anonKey: supabaseAnonKey
        }
      })
    });
    const data = await res.json();
    return {
      success: data.success ?? false,
      sentCount: data.sentCount ?? 0,
      mobileDevices: data.mobileDevices ?? 0,
      message: data.message || ''
    };
  } catch (e: any) {
    console.warn('[Push Client] Push broadcast failed:', e);
    return {
      success: false,
      sentCount: 0,
      mobileDevices: 0,
      message: e.message || 'Network error'
    };
  }
};

/**
 * Request notification permission from the user and register device for cloud push
 */
export const requestNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  if (!isNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerPushSubscription();
      sendTestNotification();
    }
    return permission as NotificationPermissionStatus;
  } catch (error) {
    console.warn('Failed to request notification permission:', error);
    return 'denied';
  }
};

/**
 * Play a synthesized native chime via Web Audio API
 */
export const playNotificationSound = (isUrgent: boolean = false) => {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (isUrgent) {
      // High-priority 3-tone chime for urgent notices
      const freqs = [587.33, 880, 1174.66]; // D5, A5, D6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.25);
      });
    } else {
      // Pleasant 2-tone chime for regular announcements
      const freqs = [659.25, 880]; // E5, A5
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.15 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.3);
      });
    }
  } catch (e) {
    // Audio context may be restricted by browser auto-play policy
  }
};

/**
 * Dispatch a local/system notification to the mobile device
 */
export const dispatchSystemNotification = async (
  title: string,
  options: {
    body?: string;
    url?: string;
    tag?: string;
    isUrgent?: boolean;
    broadcastToRemoteDevices?: boolean;
  } = {}
) => {
  if (typeof window === 'undefined') return;

  const notificationOptions = {
    body: options.body || '',
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    vibrate: options.isUrgent ? [300, 100, 300, 100, 300] : [200, 100, 200],
    tag: options.tag || `powerhouse-${Date.now()}`,
    data: {
      url: options.url || '/'
    }
  };

  playNotificationSound(options.isUrgent);

  // Cross-device push: broadcast to remote mobile devices via Web Push server
  if (options.broadcastToRemoteDevices !== false) {
    sendPushNotificationToAllDevices(title, {
      body: options.body,
      url: options.url,
      tag: options.tag,
      isUrgent: options.isUrgent
    }).catch(() => {});
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  // 1. Try Service Worker showNotification (Best for Mobile PWAs)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return;
      }
    } catch (swErr) {
      console.warn('SW showNotification failed, falling back:', swErr);
    }
  }

  // 2. Fallback to standard window.Notification
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
    };
  } catch (err) {
    console.warn('Native notification display failed:', err);
  }
};

/**
 * Send a quick test notification to verify mobile notifications work
 */
export const sendTestNotification = () => {
  dispatchSystemNotification('🔔 Mobile Notifications Active!', {
    body: 'Powerhouse alerts are now enabled on this device. You will receive updates as scheduled.',
    url: '/',
    tag: 'powerhouse-test'
  });
};

/**
 * Helper to get list of already notified announcement IDs
 */
export const getNotifiedAnnouncementIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Helper to mark an announcement ID as notified on this device
 */
export const markAnnouncementAsNotified = (id: string) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getNotifiedAnnouncementIds();
    if (!current.includes(id)) {
      const updated = [...current, id].slice(-100); // keep last 100
      localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {}
};

/**
 * Check and publish scheduled announcements whose scheduled_at has arrived,
 * and dispatch mobile push notifications.
 */
export const checkAndDispatchScheduledAnnouncements = (
  announcements: Announcement[],
  updateAnnouncementStatus: (id: string, updates: Partial<Announcement>) => void
) => {
  if (typeof window === 'undefined' || !announcements || announcements.length === 0) return;

  const now = Date.now();
  const notifiedIds = getNotifiedAnnouncementIds();

  announcements.forEach((a) => {
    const scheduledTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : new Date(a.created_at).getTime();

    // Check if scheduled time has arrived
    if (scheduledTime <= now) {
      // 1. If still in SCHEDULED status, transition to PUBLISHED
      if (a.status === 'SCHEDULED') {
        console.log(`[Powerhouse Scheduler] Publishing scheduled announcement: "${a.title}"`);
        updateAnnouncementStatus(a.id, {
          status: 'PUBLISHED',
          updated_at: new Date().toISOString()
        });
      }

      // 2. If it hasn't been notified yet on this device, dispatch mobile notification
      if (!notifiedIds.includes(a.id) && (a.status === 'PUBLISHED' || a.status === 'SCHEDULED')) {
        console.log(`[Powerhouse Scheduler] Firing mobile notification for: "${a.title}"`);

        const isUrgent = a.priority === 'URGENT';
        const titlePrefix = isUrgent ? '🚨 URGENT: ' : '📢 ';

        dispatchSystemNotification(`${titlePrefix}${a.title}`, {
          body: `[${a.category}] ${a.summary}`,
          url: `/announcements/${a.id}`,
          tag: `announcement-${a.id}`,
          isUrgent
        });

        markAnnouncementAsNotified(a.id);
      }
    }
  });
};

/**
 * Register a scheduled notification directly with the Service Worker timer
 */
export const scheduleServiceWorkerNotification = (announcement: Announcement, delayMs: number) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || delayMs <= 0) return;

  navigator.serviceWorker.ready.then((reg) => {
    if (reg.active) {
      reg.active.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        title: announcement.priority === 'URGENT' ? `🚨 URGENT: ${announcement.title}` : `📢 ${announcement.title}`,
        options: {
          body: `[${announcement.category}] ${announcement.summary}`,
          data: { url: `/announcements/${announcement.id}` },
          tag: `announcement-${announcement.id}`,
          isUrgent: announcement.priority === 'URGENT'
        },
        delayMs
      });
    }
  }).catch((err) => {
    console.warn('Failed to message Service Worker for scheduled notification:', err);
  });
};

/**
 * Update the native App Icon Badge on Mobile (iOS 16.4+ & Android PWA)
 * On iOS/Desktop: uses Web Badging API navigator.setAppBadge().
 * On Android: Android OS displays the home screen red icon badge/dot based on active notifications in the status bar.
 */
export const updateAppBadge = async (count: number) => {
  if (typeof window === 'undefined') return;

  // 1. Native Web Badging API (iOS 16.4+ PWA and desktop)
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }
    } catch (err) {
      // Badging API may be restricted depending on OS permission
    }
  }

  // 2. Inform active Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.active) {
        reg.active.postMessage({
          type: 'SET_APP_BADGE',
          count
        });
      }
    } catch (e) {}
  }

  // 3. Android Home Screen Icon Badging Bridge:
  // Android OS launchers (Xiaomi/MIUI, Samsung, Pixel) display the red circle/dot on the home screen icon
  // exclusively when an active notification is present in the Android notification shade.
  if (isNotificationSupported() && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        if (count > 0) {
          await reg.showNotification(`🔴 Powerhouse: ${count} New Notice${count > 1 ? 's' : ''}`, {
            tag: 'powerhouse-unread-badge',
            body: `You have ${count} unread announcement${count > 1 ? 's' : ''}. Tap to open.`,
            icon: '/web-app-manifest-192x192.png',
            badge: '/favicon-96x96.png',
            renotify: false,
            silent: true,
            data: { url: '/' }
          } as any);
        } else {
          const notifications = await reg.getNotifications({ tag: 'powerhouse-unread-badge' });
          notifications.forEach((n) => n.close());
        }
      }
    } catch (err) {
      console.warn('Android notification badge bridge failed:', err);
    }
  }

  // 4. Dynamic Browser Tab Title with Badge Counter
  try {
    const titleRegex = /^\(\d+\)\s*/;
    const cleanTitle = document.title.replace(titleRegex, '');
    if (count > 0) {
      document.title = `(${count}) ${cleanTitle}`;
    } else {
      document.title = cleanTitle;
    }
  } catch (e) {}
};

/**
 * Clear the native App Icon Badge
 */
export const clearAppBadge = async () => {
  await updateAppBadge(0);
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        const notifications = await reg.getNotifications({ tag: 'powerhouse-unread-badge' });
        notifications.forEach((n) => n.close());
      }
    } catch (e) {}
  }
};

