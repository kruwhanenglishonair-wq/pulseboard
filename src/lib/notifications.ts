/**
 * Powerhouse Notification Service
 * Handles Web Push, Service Worker notifications, audio chimes,
 * and scheduled announcement dispatch for mobile & desktop PWAs.
 */

import { Announcement } from '@/lib/types';

const NOTIFIED_STORAGE_KEY = 'powerhouse_notified_announcements_v1';

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
 * Request notification permission from the user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  if (!isNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
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
 * Update the native App Icon Badge on Mobile (iOS 16.4+ / Android PWA)
 * This renders the red circle with the unread count directly on the home screen mobile app icon.
 */
export const updateAppBadge = async (count: number) => {
  if (typeof window === 'undefined') return;

  // 1. Native Web Badging API (home screen mobile icon badge)
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
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_APP_BADGE',
        count
      });
    } catch (e) {}
  }

  // 3. Dynamic Browser Tab Title with Badge Counter
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
};

