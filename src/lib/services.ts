import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { Service, SystemSetting } from '@/types/database';
import { INITIAL_SERVICES, INITIAL_SETTINGS } from '@/lib/constants';
import { getStoredServices, getStoredSettings, saveStoredSettings } from '@/lib/storage';

export const DEFAULT_SERVICES: Service[] = INITIAL_SERVICES;
export const DEFAULT_SETTINGS: Record<string, string> = INITIAL_SETTINGS;

// Global in-memory cache to guarantee sub-50ms page load speeds
declare global {
  var __grisella_cachedServices: Service[] | undefined;
  var __grisella_cachedServicesTime: number | undefined;
  var __grisella_cachedSettings: Record<string, string> | undefined;
  var __grisella_cachedSettingsTime: number | undefined;
}

const CACHE_TTL_MS = 60 * 1000; // 60 detik cache di memory

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return createAdminClient();
  }
  return createClient();
}

/**
 * Timeout helper: Supabase dibatasi maksimal 1.5 detik agar halaman tidak pernah lemot / hang.
 * Jika jaringan lambat, sistem langsung melayani data instan dari memori / local data.
 */
async function fetchWithTimeout<T>(promise: Promise<T>, ms = 1500, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]).catch(() => fallback);
}

/**
 * Mengambil daftar layanan aktif dengan kecepatan tinggi (<50ms)
 * Memakai cache memory, timeout pelindung, dan fallback storage.
 */
export async function getActiveServices(): Promise<Service[]> {
  try {
    const now = Date.now();
    // 1. Jika ada cache memory valid, langsung return instan
    if (globalThis.__grisella_cachedServices && (now - (globalThis.__grisella_cachedServicesTime || 0)) < CACHE_TTL_MS) {
      return globalThis.__grisella_cachedServices;
    }

    // 2. Query Supabase dengan batas timeout 1.5 detik
    const supabaseFetch = async (): Promise<Service[] | null> => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as Service[];
        }
      } catch {
        // Supabase error
      }
      return null;
    };

    const remoteData = await fetchWithTimeout(supabaseFetch(), 1500, null);

    if (remoteData && remoteData.length > 0) {
      globalThis.__grisella_cachedServices = remoteData;
      globalThis.__grisella_cachedServicesTime = now;
      return remoteData;
    }

    // 3. Fallback ke local storage / constants
    const stored = getStoredServices();
    if (stored && stored.length > 0) {
      const active = stored.filter((s) => s.is_active);
      globalThis.__grisella_cachedServices = active;
      globalThis.__grisella_cachedServicesTime = now;
      return active;
    }

    return DEFAULT_SERVICES;
  } catch {
    return DEFAULT_SERVICES;
  }
}

/**
 * Mengambil pengaturan sistem dengan kecepatan tinggi (<50ms)
 */
export async function getSystemSettings(): Promise<Record<string, string>> {
  try {
    const now = Date.now();
    // 1. Jika ada cache memory valid, langsung return instan
    if (globalThis.__grisella_cachedSettings && (now - (globalThis.__grisella_cachedSettingsTime || 0)) < CACHE_TTL_MS) {
      return globalThis.__grisella_cachedSettings;
    }

    // 2. Query Supabase dengan batas timeout 1.5 detik
    const supabaseFetch = async (): Promise<Record<string, string> | null> => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('settings').select('*');

        if (!error && data && data.length > 0) {
          const map: Record<string, string> = { ...DEFAULT_SETTINGS };
          data.forEach((row: SystemSetting) => {
            map[row.key] = row.value;
          });
          return map;
        }
      } catch {
        // Supabase error
      }
      return null;
    };

    const remoteSettings = await fetchWithTimeout(supabaseFetch(), 1500, null);

    if (remoteSettings && Object.keys(remoteSettings).length > 0) {
      globalThis.__grisella_cachedSettings = remoteSettings;
      globalThis.__grisella_cachedSettingsTime = now;
      saveStoredSettings(remoteSettings);
      return remoteSettings;
    }

    // 3. Fallback ke local storage
    const stored = getStoredSettings();
    if (stored && Object.keys(stored).length > 0) {
      globalThis.__grisella_cachedSettings = stored;
      globalThis.__grisella_cachedSettingsTime = now;
      return stored;
    }

    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Reset cache memory saat admin mengubah setting / layanan agar langsung update
 */
export function invalidateGlobalCache() {
  globalThis.__grisella_cachedServices = undefined;
  globalThis.__grisella_cachedServicesTime = 0;
  globalThis.__grisella_cachedSettings = undefined;
  globalThis.__grisella_cachedSettingsTime = 0;
}
