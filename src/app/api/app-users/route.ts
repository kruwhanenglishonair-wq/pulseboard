import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

// GET all app_users or single user by email from Supabase
export async function GET(req: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured on server (SUPABASE_URL and SUPABASE_ANON_KEY are missing)', users: [] },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const emailParam = searchParams.get('email');

  if (emailParam) {
    const cleanEmail = emailParam.trim();

    // 1. Check public.app_users (case-insensitive)
    const { data: appUser, error: appUserErr } = await supabase
      .from('app_users')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (appUserErr) {
      return NextResponse.json({ success: false, error: appUserErr.message }, { status: 400 });
    }

    if (appUser) {
      return NextResponse.json({ success: true, user: appUser });
    }

    // 2. Fallback: Check public.profiles just in case user exists there
    const { data: profileUser } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (profileUser) {
      const mappedUser = {
        id: profileUser.id,
        email: profileUser.email,
        nickname: profileUser.full_name || profileUser.email.split('@')[0],
        password: null,
        role: profileUser.role === 'super_admin' ? 'dementor' : 'employee',
        department: profileUser.department || 'General',
        location: profileUser.location || 'Bangkok HQ',
        avatar_url: profileUser.avatar_url || '',
        created_at: profileUser.created_at || new Date().toISOString()
      };
      return NextResponse.json({ success: true, user: mappedUser });
    }

    return NextResponse.json({ success: true, user: null });
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message, users: [] }, { status: 400 });
  }

  return NextResponse.json({ success: true, users: data || [] });
}

// POST insert new app_user
export async function POST(req: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { data, error } = await supabase.from('app_users').insert([body]).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT update app_user (e.g. set password or update details)
export async function PUT(req: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { id, email, ...updateFields } = body;

    let query = supabase.from('app_users').update(updateFields);

    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.ilike('email', email.trim());
    } else {
      return NextResponse.json({ success: false, error: 'Missing id or email' }, { status: 400 });
    }

    const { data, error } = await query.select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE app_user
export async function DELETE(req: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing user id' }, { status: 400 });
    }

    const { error } = await supabase.from('app_users').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
