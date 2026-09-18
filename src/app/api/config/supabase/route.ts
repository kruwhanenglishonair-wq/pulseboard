import { NextResponse } from 'next/server';
import { cleanSupabaseUrl, cleanSupabaseKey } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const rawKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const url = cleanSupabaseUrl(rawUrl);
  const anonKey = cleanSupabaseKey(rawKey);

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.trim() !== '' &&
    anonKey.trim() !== '' &&
    !url.includes('your-project')
  );

  return NextResponse.json({
    configured: isConfigured,
    url: isConfigured ? url : '',
    anonKey: isConfigured ? anonKey : ''
  });
}
