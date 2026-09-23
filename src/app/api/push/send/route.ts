import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '@/lib/pushConfig';
import { getServerSupabase } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  isUrgent?: boolean;
  subscriptions?: any[];
  supabaseConfig?: {
    url?: string;
    anonKey?: string;
  };
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export async function POST(req: NextRequest) {
  try {
    const payload: PushPayload = await req.json();

    if (!payload.title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    // 1. Gather all active subscriptions
    const subscriptionsMap = new Map<string, any>();

    // A. Subscriptions provided directly in request payload (e.g. from client Supabase query)
    if (payload.subscriptions && Array.isArray(payload.subscriptions)) {
      payload.subscriptions.forEach((sub: any) => {
        if (sub && sub.endpoint) {
          subscriptionsMap.set(sub.endpoint, sub);
        }
      });
    }

    // B. From global memory cache / file
    try {
      const memoryStore = (globalThis as any)._powerhousePushSubscriptions;
      if (memoryStore) {
        memoryStore.forEach((sub: any, endpoint: string) => {
          if (!subscriptionsMap.has(endpoint)) {
            subscriptionsMap.set(endpoint, sub);
          }
        });
      }

      const filePath = path.join('/tmp', 'powerhouse_subscriptions.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const list = JSON.parse(raw);
        list.forEach((sub: any) => {
          if (sub.endpoint && !subscriptionsMap.has(sub.endpoint)) {
            subscriptionsMap.set(sub.endpoint, sub);
          }
        });
      }
    } catch (e) {}

    // C. Also fetch from Supabase if configured (via server env or dynamic payload config)
    let supabase = getServerSupabase();
    if (!supabase && payload.supabaseConfig?.url && payload.supabaseConfig?.anonKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        supabase = createClient(payload.supabaseConfig.url, payload.supabaseConfig.anonKey, {
          auth: { persistSession: false }
        });
      } catch (e) {}
    }

    if (supabase) {
      try {
        const { data } = await supabase.from('push_subscriptions').select('*');
        if (data && Array.isArray(data)) {
          data.forEach((sub: any) => {
            if (sub.endpoint) subscriptionsMap.set(sub.endpoint, sub);
          });
        }
      } catch (dbErr) {}
    }

    const subscriptions = Array.from(subscriptionsMap.values());

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: 'No devices have registered for push notifications yet. Please open Powerhouse on your phone and tap "Turn On Alerts" or "Set Badge".'
      });
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body || '',
      url: payload.url || '/',
      tag: payload.tag || `powerhouse-${Date.now()}`,
      isUrgent: payload.isUrgent ?? false
    });

    let sentCount = 0;
    let failedCount = 0;
    const expiredEndpoints: string[] = [];

    // Send push to each subscribed device in parallel
    const pushPromises = subscriptions.map(async (sub) => {
      let p256dh = sub.keys?.p256dh;
      let auth = sub.keys?.auth;
      if (typeof sub.keys === 'string') {
        try {
          const parsed = JSON.parse(sub.keys);
          p256dh = parsed.p256dh;
          auth = parsed.auth;
        } catch (e) {}
      }

      if (!sub.endpoint || !p256dh || !auth) {
        failedCount++;
        console.warn(`[Web Push Skip] Invalid subscription keys for endpoint:`, sub.endpoint);
        return;
      }

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh, auth }
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
        sentCount++;
        console.log(`[Web Push Success] Delivered to FCM: ${sub.endpoint.slice(0, 45)}... (Mobile: ${Boolean(sub.is_mobile || sub.isMobile)})`);
      } catch (err: any) {
        failedCount++;
        // If expired or unregistered (410 Gone / 404 Not Found), mark for deletion
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
          console.log(`[Web Push Expired] Subscription expired (HTTP ${err.statusCode}), queueing removal: ${sub.endpoint.slice(0, 30)}...`);
        } else {
          console.warn(`[Web Push Error] ${sub.endpoint.slice(0, 30)}: HTTP ${err.statusCode || 'ERR'} - ${err.message || err}`);
        }
      }
    });

    await Promise.all(pushPromises);

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      try {
        const memoryStore = (globalThis as any)._powerhousePushSubscriptions;
        if (memoryStore) {
          expiredEndpoints.forEach((ep) => memoryStore.delete(ep));
        }
        if (supabase) {
          await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
        }
      } catch (cleanErr) {}
    }

    console.log(`[Web Push Broadcast] Sent: ${sentCount}, Failed: ${failedCount}, Expired: ${expiredEndpoints.length}`);

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      totalDevices: subscriptions.length,
      mobileDevices: subscriptions.filter((s) => s.isMobile || s.is_mobile).length,
      message: `Push alert dispatched to ${sentCount} device(s)!`
    });
  } catch (err: any) {
    console.error('[Web Push Send Exception]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
