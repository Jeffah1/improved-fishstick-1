import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        'Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment.'
      );
    }

    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

// For backward compatibility during transition if needed, but prefer getSupabase()
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop, receiver) => {
    return Reflect.get(getSupabase(), prop, receiver);
  }
});
