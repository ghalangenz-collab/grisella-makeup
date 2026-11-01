import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStoredSettings, saveStoredSettings } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = getStoredSettings();
    return NextResponse.json({ settings });
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

    // 1. Save directly to local storage
    const saved = saveStoredSettings(settings);

    // 2. Best-effort Supabase sync with 1.5s timeout
    try {
      const supabase = createAdminClient();
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }));
      await Promise.race([
        supabase.from('settings').upsert(updates),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
      ]);
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
