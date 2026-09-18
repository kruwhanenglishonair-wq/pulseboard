import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Sanitize Supabase URL: strip /rest/v1, trailing slashes, dashboard paths, and quotes
export const cleanSupabaseUrl = (input: string): string => {
  if (!input) return '';
  let url = input.trim().replace(/^["']|["']$/g, '').trim();

  // If user pasted dashboard project URL: https://supabase.com/dashboard/project/<project_ref>
  const dashboardMatch = url.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // If user omitted protocol: xyz.supabase.co
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    // Base origin only: e.g. https://xyz.supabase.co
    // Removes any trailing slashes, /rest/v1, /graphql, /dashboard, etc.
    return `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    return url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }
};

export const cleanSupabaseKey = (input: string): string => {
  if (!input) return '';
  return input.trim().replace(/^["']|["']$/g, '').trim();
};

let dynamicUrl = '';
let dynamicAnonKey = '';

export const setSupabaseConfig = (url: string, key: string) => {
  const cleanedUrl = cleanSupabaseUrl(url);
  const cleanedKey = cleanSupabaseKey(key);

  if (cleanedUrl && cleanedKey) {
    dynamicUrl = cleanedUrl;
    dynamicAnonKey = cleanedKey;
    supabaseInstance = createClient(dynamicUrl, dynamicAnonKey, {
      auth: {
        persistSession: false
      }
    });
  }
};

export const getSupabaseUrl = (): string => {
  const raw = dynamicUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  return cleanSupabaseUrl(raw);
};

export const getSupabaseAnonKey = (): string => {
  const raw = dynamicAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return cleanSupabaseKey(raw);
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
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
  }
  return supabaseInstance;
};
