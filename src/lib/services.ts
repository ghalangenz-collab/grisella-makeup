import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { Service, SystemSetting } from '@/types/database';
import { INITIAL_SERVICES, INITIAL_SETTINGS } from '@/lib/constants';
import { getStoredServices, getStoredSettings, saveStoredSettings } from '@/lib/storage';

export const DEFAULT_SERVICES: Service[] = INITIAL_SERVICES;
export const DEFAULT_SETTINGS: Record<string, string> = INITIAL_SETTINGS;

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return createAdminClient();
  }
  return createClient();
}

/**
 * Mengambil daftar layanan aktif dari storage (prioritas) atau Supabase
 */
export async function getActiveServices(): Promise<Service[]> {
  try {
    // 1. Coba ambil dari Supabase agar perubahan paket & foto dari admin langsung tersinkron ke semua device
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
      // Supabase unavailable, fallback to storage
    }

    // 2. Fallback ke local storage / constants
    const stored = getStoredServices();
    if (stored && stored.length > 0) {
      return stored.filter((s) => s.is_active);
    }
    return DEFAULT_SERVICES;
  } catch {
    return DEFAULT_SERVICES;
  }
}

/**
 * Mengambil pengaturan sistem dari Supabase (sinkronisasi multi-device) dengan fallback storage
 */
export async function getSystemSettings(): Promise<Record<string, string>> {
  try {
    // 1. Coba ambil dari Supabase agar nomor WhatsApp dan setting sinkron di semua HP & laptop
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('settings').select('*');

      if (!error && data && data.length > 0) {
        const map: Record<string, string> = { ...DEFAULT_SETTINGS };
        data.forEach((row: SystemSetting) => {
          map[row.key] = row.value;
        });
        saveStoredSettings(map);
        return map;
      }
    } catch {
      // Supabase unavailable, fallback to storage
    }

    // 2. Fallback ke local storage
    const stored = getStoredSettings();
    if (stored && Object.keys(stored).length > 0) {
      return stored;
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
