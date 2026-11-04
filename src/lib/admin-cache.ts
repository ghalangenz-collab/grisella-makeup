/**
 * Client-Side In-Memory Cache untuk Panel Admin Grisella MUA
 * Menghilangkan waktu tunggu (0ms render instan) saat admin berpindah-pindah menu:
 * Beranda <-> Daftar Booking <-> Kalender <-> Klien <-> Laporan <-> Pengaturan
 */

export function getAdminCache<T>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = (window as any).__grisellaAdminCache?.[key];
    if (raw) return raw as T;
    // Cek sessionStorage sebagai persistence ringan antar tab refresh
    const sessionRaw = sessionStorage.getItem(`grisella_admin_cache_${key}`);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      (window as any).__grisellaAdminCache = (window as any).__grisellaAdminCache || {};
      (window as any).__grisellaAdminCache[key] = parsed;
      return parsed as T;
    }
  } catch {}
  return undefined;
}

export function setAdminCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    (window as any).__grisellaAdminCache = (window as any).__grisellaAdminCache || {};
    (window as any).__grisellaAdminCache[key] = data;
    sessionStorage.setItem(`grisella_admin_cache_${key}`, JSON.stringify(data));
  } catch {}
}
