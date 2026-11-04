import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

// Khusus operasi backend aman (API Routes / Webhook / Edge logic)
// Tidak pernah diekspor ke browser / client component.
export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    getSupabaseAnonKey();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
