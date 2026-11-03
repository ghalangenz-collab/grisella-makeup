import { createClient } from '@supabase/supabase-js';

// Khusus operasi backend aman (API Routes / Webhook / Edge logic)
// Tidak pernah diekspor ke browser / client component.
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://lzucxgbxvixlybpwbodh.supabase.co';
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_bTnZiVyO9Vx3DyG4UyR_7Q_yIYkJS6Q';

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
