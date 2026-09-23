/**
 * Web Push & VAPID Configuration
 * Supports Cross-Device Push Notifications (PC -> Mobile)
 */

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BK58U58lvt80XVPgV_bbumZZDLcl6459ykp88iLcss88hLPE3Co5eA35b8M4CU71EG26GOPLE5J5m1hRP6FgUxI';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'UgjWrtg6dg4uD2D1NYAvyM6mFDH_OeW3LMXVYGg-G1Q';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:admin@powerhouse.internal';

/**
 * Convert a base64 string to a Uint8Array for pushManager.subscribe
 */
export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
