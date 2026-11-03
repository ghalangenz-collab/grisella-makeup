import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { Service, SystemSetting } from '@/types/database';
import { INITIAL_SERVICES, INITIAL_SETTINGS } from '@/lib/constants';
import { getStoredServices, getStoredSettings, saveStoredServices, saveStoredSettings } from '@/lib/storage';

export const DEFAULT_SERVICES: Service[] = INITIAL_SERVICES;
export const DEFAULT_SETTINGS: Record<string, string> = INITIAL_SETTINGS;

// Short in-memory cache (2 detik) hanya untuk dedup request bersamaan dalam satu render siklus
declare global {
  var __grisella_cachedServices: Service[] | undefined;
  var __grisella_cachedServicesTime: number | undefined;
  var __grisella_cachedSettings: Record<string, string> | undefined;
  var __grisella_cachedSettingsTime: number | undefined;
}

const CACHE_TTL_MS = 2000; // 2 detik saja agar perubahan admin langsung aktif di semua HP & Laptop

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return createAdminClient();
  }
  return createClient();
}

/**
 * Mengambil daftar layanan aktif langsung dari Supabase Database (Single Source of Truth)
 */
export async function getActiveServices(): Promise<Service[]> {
  const now = Date.now();
  if (
    globalThis.__grisella_cachedServices &&
    now - (globalThis.__grisella_cachedServicesTime || 0) < CACHE_TTL_MS
  ) {
    return globalThis.__grisella_cachedServices;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (!error && data && data.length > 0) {
      const activeServices = data as Service[];
      globalThis.__grisella_cachedServices = activeServices;
      globalThis.__grisella_cachedServicesTime = now;
      saveStoredServices(activeServices);
      return activeServices;
    }
  } catch (err) {
    console.warn('Supabase getActiveServices query notice:', err);
  }

  // Fallback ke local storage jika database tidak dapat dijangkau
  const stored = getStoredServices();
  if (stored && stored.length > 0) {
    const active = stored.filter((s) => s.is_active);
    globalThis.__grisella_cachedServices = active;
    globalThis.__grisella_cachedServicesTime = now;
    return active;
  }

  return DEFAULT_SERVICES;
}

/**
 * Mengambil pengaturan sistem real-time dari Supabase Database (Single Source of Truth)
 * Menjamin perubahan nomor WhatsApp / alamat / QRIS dari Admin langsung sinkron ke semua device.
 */
export async function getSystemSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (
    globalThis.__grisella_cachedSettings &&
    now - (globalThis.__grisella_cachedSettingsTime || 0) < CACHE_TTL_MS
  ) {
    return globalThis.__grisella_cachedSettings;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('settings').select('*');

    if (!error && data && data.length > 0) {
      const map: Record<string, string> = { ...DEFAULT_SETTINGS };
      data.forEach((row: SystemSetting) => {
        if (row.key && row.value !== undefined && row.value !== null) {
          map[row.key] = row.value;
        }
      });

      globalThis.__grisella_cachedSettings = map;
      globalThis.__grisella_cachedSettingsTime = now;
      saveStoredSettings(map);
      return map;
    }
  } catch (err) {
    console.warn('Supabase getSystemSettings query notice:', err);
  }

  // Fallback ke local storage jika database tidak dapat dijangkau
  const stored = getStoredSettings();
  if (stored && Object.keys(stored).length > 0) {
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    globalThis.__grisella_cachedSettings = merged;
    globalThis.__grisella_cachedSettingsTime = now;
    return merged;
  }

  return DEFAULT_SETTINGS;
}

/**
 * Reset cache memory seketika saat admin mengubah setting / layanan
 */
export function invalidateGlobalCache() {
  globalThis.__grisella_cachedServices = undefined;
  globalThis.__grisella_cachedServicesTime = 0;
  globalThis.__grisella_cachedSettings = undefined;
  globalThis.__grisella_cachedSettingsTime = 0;
}
