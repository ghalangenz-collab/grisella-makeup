import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { mergeStoredClients } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { target_id, source_id } = await request.json();

    if (!target_id || !source_id || target_id === source_id) {
      return NextResponse.json({ error: 'Target dan source ID harus berbeda' }, { status: 400 });
    }

    // 1. Merge in local storage
    mergeStoredClients(target_id, source_id);

    // 2. Best-effort Supabase sync with timeout
    try {
      const supabase = createAdminClient();
      await Promise.race([
        Promise.all([
          supabase.from('bookings').update({ client_id: target_id }).eq('client_id', source_id),
          supabase.from('clients').delete().eq('id', source_id),
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
      ]);
    } catch (e) {
      console.warn('Supabase client merge skipped:', e);
    }

    try {
      revalidatePath('/admin/klien', 'page');
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Merge clients error:', error);
    return NextResponse.json({ error: 'Gagal menggabungkan klien' }, { status: 500 });
  }
}
