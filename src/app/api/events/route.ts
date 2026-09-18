import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured on server', events: [] });
  }

  const { data, error } = await supabase
    .from('company_events')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message, events: [] }, { status: 400 });
  }

  return NextResponse.json({ success: true, events: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { data, error } = await supabase.from('company_events').insert([body]).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, event: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
