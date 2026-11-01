import { createClient } from '@/lib/supabase/client';
import { Service, SystemSetting } from '@/types/database';
import { INITIAL_SERVICES, INITIAL_SETTINGS } from '@/lib/constants';
import { getStoredServices, getStoredSettings } from '@/lib/storage';

export const DEFAULT_SERVICES: Service[] = INITIAL_SERVICES;
export const DEFAULT_SETTINGS: Record<string, string> = INITIAL_SETTINGS;

/**
 * Mengambil daftar layanan aktif dari storage (prioritas) atau Supabase
 */
export async function getActiveServices(): Promise<Service[]> {
  try {
    // 1. Ambil dari local storage (selalu akurat dan instan)
    const stored = getStoredServices();
    if (stored && stored.length > 0) {
      return stored.filter((s) => s.is_active);
    }

    // 2. Fallback ke Supabase jika ada
    const supabase = createClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as Service[];
    }
    return DEFAULT_SERVICES;
  } catch {
    return DEFAULT_SERVICES;
  }
}

/**
 * Mengambil pengaturan sistem dari storage (prioritas) atau Supabase
 */
export async function getSystemSettings(): Promise<Record<string, string>> {
  try {
    // 1. Ambil dari local storage
    const stored = getStoredSettings();
    if (stored && Object.keys(stored).length > 0) {
      return stored;
    }

    // 2. Fallback ke Supabase
    const supabase = createClient();
    const { data, error } = await supabase.from('settings').select('*');

    if (!error && data && data.length > 0) {
      const map: Record<string, string> = { ...DEFAULT_SETTINGS };
      data.forEach((row: SystemSetting) => {
        map[row.key] = row.value;
      });
      return map;
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
