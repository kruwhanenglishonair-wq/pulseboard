import { createClient, SupabaseClient } from '@supabase/supabase-js';

let dynamicUrl = '';
let dynamicAnonKey = '';

export const setSupabaseConfig = (url: string, key: string) => {
  if (url && key) {
    dynamicUrl = url.trim();
    dynamicAnonKey = key.trim();
    supabaseInstance = createClient(dynamicUrl, dynamicAnonKey, {
      auth: {
        persistSession: false
      }
    });
  }
};

export const getSupabaseUrl = (): string => {
  return dynamicUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
};

export const getSupabaseAnonKey = (): string => {
  return dynamicAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
};

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    url.trim() !== '' &&
    key.trim() !== '' &&
    url !== 'https://your-project.supabase.co' &&
    !url.includes('your-project')
  );
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
  }
  return supabaseInstance;
};
