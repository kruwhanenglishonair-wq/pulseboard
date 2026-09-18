import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const getServerSupabase = (): SupabaseClient | null => {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (!url || !key || url.trim() === '' || key.trim() === '' || url.includes('your-project')) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
};
