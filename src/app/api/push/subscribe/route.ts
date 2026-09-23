import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string | null;
  userAgent?: string;
  isMobile?: boolean;
  updatedAt: string;
}

// Global in-memory cache for serverless runtime
declare global {
  var _powerhousePushSubscriptions: Map<string, StoredSubscription> | undefined;
}

const getMemoryStore = (): Map<string, StoredSubscription> => {
  if (!globalThis._powerhousePushSubscriptions) {
    globalThis._powerhousePushSubscriptions = new Map();

    // Try restoring from fallback file if available
    try {
      const filePath = path.join('/tmp', 'powerhouse_subscriptions.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const list: StoredSubscription[] = JSON.parse(raw);
        list.forEach((sub) => {
          if (sub.endpoint) globalThis._powerhousePushSubscriptions?.set(sub.endpoint, sub);
        });
      }
    } catch (e) {}
  }
  return globalThis._powerhousePushSubscriptions;
};

const persistMemoryStore = () => {
  try {
    const store = getMemoryStore();
    const list = Array.from(store.values());
    const filePath = path.join('/tmp', 'powerhouse_subscriptions.json');
    fs.writeFileSync(filePath, JSON.stringify(list), 'utf-8');
  } catch (e) {}
};

export async function GET() {
  const store = getMemoryStore();
  const list = Array.from(store.values());
  const mobileCount = list.filter((s) => s.isMobile).length;

  return NextResponse.json({
    success: true,
    totalDevices: list.length,
    mobileDevices: mobileCount,
    devices: list.map((s) => ({
      endpoint: s.endpoint.slice(0, 30) + '...',
      isMobile: s.isMobile,
      updatedAt: s.updatedAt
    }))
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, deviceInfo, userId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'Invalid push subscription payload' },
        { status: 400 }
      );
    }

    const storedSub: StoredSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      userId: userId || null,
      userAgent: deviceInfo?.userAgent || '',
      isMobile: deviceInfo?.isMobile ?? false,
      updatedAt: new Date().toISOString()
    };

    // 1. Save to in-memory / file cache
    const store = getMemoryStore();
    store.set(storedSub.endpoint, storedSub);
    persistMemoryStore();

    // 2. Also attempt saving to Supabase if available
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('push_subscriptions').upsert(
          {
            endpoint: storedSub.endpoint,
            keys: storedSub.keys,
            user_id: storedSub.userId,
            user_agent: storedSub.userAgent,
            is_mobile: storedSub.isMobile,
            updated_at: storedSub.updatedAt
          },
          { onConflict: 'endpoint' }
        );
      } catch (dbErr) {
        // Table may not exist yet, cache is primary
      }
    }

    console.log(`[Push Server] Registered push subscription (${storedSub.isMobile ? 'Mobile' : 'Desktop'})`);

    return NextResponse.json({
      success: true,
      message: 'Subscription registered successfully',
      deviceType: storedSub.isMobile ? 'mobile' : 'desktop'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
