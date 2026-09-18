import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured on server', announcements: [] });
  }

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('scheduled_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message, announcements: [] }, { status: 400 });
  }

  return NextResponse.json({ success: true, announcements: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { data, error } = await supabase.from('announcements').insert([body]).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, announcement: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
