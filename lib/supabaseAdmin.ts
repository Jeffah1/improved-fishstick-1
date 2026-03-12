import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'Missing Supabase Admin environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment.'
      );
    }

    supabaseAdminInstance = createClient(url, key);
  }
  return supabaseAdminInstance;
}

// For backward compatibility during transition if needed, but prefer getSupabaseAdmin()
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (target, prop, receiver) => {
    return Reflect.get(getSupabaseAdmin(), prop, receiver);
  }
});
