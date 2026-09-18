import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

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
