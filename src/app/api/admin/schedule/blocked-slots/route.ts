import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { addStoredBlockedSlot } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { start_at, end_at, reason } = body;

    if (!start_at || !end_at) {
      return NextResponse.json({ error: 'Waktu mulai dan selesai wajib diisi' }, { status: 400 });
    }

    // 1. Add to local storage
    const newSlot = addStoredBlockedSlot({
      start_at,
      end_at,
      reason,
    });

    // 2. Best-effort Supabase sync with 1.5s timeout
    try {
      const supabase = createAdminClient();
      await Promise.race([
        supabase.from('blocked_slots').insert({
          id: newSlot.id,
          start_at,
          end_at,
          reason,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
      ]);
    } catch (e) {
      console.warn('Supabase blocked-slots sync skipped:', e);
    }

    // 3. Purge cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin', 'layout');
    } catch {}

    return NextResponse.json({ success: true, data: newSlot });
  } catch (error) {
    console.error('Error adding blocked slot:', error);
    return NextResponse.json({ error: 'Gagal menambah blokir slot' }, { status: 500 });
  }
}
