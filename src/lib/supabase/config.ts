export function getSupabaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  if (!url || url.includes('placeholder')) {
    return 'https://lzucxgbxvixlybpwbodh.supabase.co';
  }
  // Otomatis koreksi typo lzucxgbvx jika ada di environment variable
  if (url.includes('lzucxgbvx')) {
    return url.replace('lzucxgbvx', 'lzucxgbx');
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_bTnZiVyO9Vx3DyG4UyR_7Q_yIYkJS6Q'
  );
}
