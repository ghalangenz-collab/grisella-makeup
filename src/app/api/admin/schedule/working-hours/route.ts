import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateStoredWorkingHour } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { day_of_week, is_active, start_time, end_time } = body;

    const dayNum = Number(day_of_week);
    if (day_of_week === undefined || isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      return NextResponse.json({ error: 'Hari tidak valid (0-6)' }, { status: 400 });
    }

    const changes: Record<string, any> = {};
    if (is_active !== undefined) changes.is_active = Boolean(is_active);
    if (start_time) changes.start_time = String(start_time).trim();
    if (end_time) changes.end_time = String(end_time).trim();

    // 1. Update in local storage
    const updated = updateStoredWorkingHour(dayNum, changes);

    // 2. Best-effort Supabase sync with 1.5s timeout
    try {
      const supabase = createAdminClient();
      await Promise.race([
        supabase.from('working_hours').upsert({
          day_of_week: dayNum,
          ...changes,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
      ]);
    } catch (e) {
      console.warn('Supabase working-hours sync skipped:', e);
    }

    // 3. Purge cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin', 'layout');
    } catch {}

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating working hour:', error);
    return NextResponse.json({ error: 'Gagal memperbarui jam kerja' }, { status: 500 });
  }
}
