import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStoredSettings, saveStoredSettings } from '@/lib/storage';
import { invalidateGlobalCache } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const localSettings = getStoredSettings();
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from('settings').select('*');
      if (!error && data && data.length > 0) {
        const remoteMap: Record<string, string> = { ...localSettings };
        data.forEach((row: any) => {
          remoteMap[row.key] = row.value;
        });
        return NextResponse.json({ settings: remoteMap });
      }
    } catch (e) {
      console.warn('Supabase settings fetch skipped:', e);
    }
    return NextResponse.json({ settings: localSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ settings: {} }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Data pengaturan tidak valid' }, { status: 400 });
    }

    // 1. Save directly to local storage and clear memory cache
    const saved = saveStoredSettings(settings);
    invalidateGlobalCache();

    // 2. Best-effort Supabase sync
    try {
      const supabase = createAdminClient();
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }));
      const { error: upsertErr } = await supabase.from('settings').upsert(updates);
      if (upsertErr) {
        console.warn('Supabase settings upsert warning:', upsertErr.message);
      }
    } catch (e) {
      console.warn('Supabase settings upsert skipped:', e);
    }

    // 3. Purge cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin', 'layout');
    } catch {}

    return NextResponse.json({ success: true, settings: saved });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}
