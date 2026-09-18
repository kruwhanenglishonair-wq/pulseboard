import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cleanSupabaseUrl, cleanSupabaseKey } from './supabase';

export const getServerSupabase = (): SupabaseClient | null => {
  const rawUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const rawKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const url = cleanSupabaseUrl(rawUrl);
  const key = cleanSupabaseKey(rawKey);

  if (!url || !key || url.trim() === '' || key.trim() === '' || url.includes('your-project')) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
};
