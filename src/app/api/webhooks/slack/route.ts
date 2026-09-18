import { NextRequest, NextResponse } from 'next/server';
import { sendAnnouncementWebhook } from '@/lib/webhook';
import { Announcement } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const announcement = body.announcement as Announcement;

    if (!announcement || !announcement.title) {
      return NextResponse.json(
        { error: 'Missing announcement payload' },
        { status: 400 }
      );
    }

    const platform = (body.platform as 'slack' | 'teams') || 'slack';
    const result = await sendAnnouncementWebhook(announcement, platform);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
