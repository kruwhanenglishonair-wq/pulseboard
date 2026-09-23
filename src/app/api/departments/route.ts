import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

// GET all departments from Supabase
export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured on server', departments: [] },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      // If table doesn't exist yet in user's Supabase, gracefully report it
      return NextResponse.json({ success: false, error: error.message, departments: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, departments: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, departments: [] }, { status: 500 });
  }
}

// POST create new department
export async function POST(req: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { name, description, color, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Department name is required' }, { status: 400 });
    }

    const payload = {
      name: name.trim(),
      description: (description || '').trim(),
      color: color || '#3b82f6',
      icon: icon || 'Layers'
    };

    const { data, error } = await supabase
      .from('departments')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, department: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT update existing department
export async function PUT(req: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { id, name, description, color, icon } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Department ID is required' }, { status: 400 });
    }

    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (color !== undefined) updateFields.color = color;
    if (icon !== undefined) updateFields.icon = icon;

    const { data, error } = await supabase
      .from('departments')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, department: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE department
export async function DELETE(req: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Department ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('departments').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
