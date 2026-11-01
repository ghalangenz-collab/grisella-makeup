import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteStoredBlockedSlot } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteStoredBlockedSlot(id);

    try {
      const supabase = createAdminClient();
      await Promise.race([
        supabase.from('blocked_slots').delete().eq('id', id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
      ]);
    } catch (e) {
      console.warn('Supabase delete blocked slot skipped:', e);
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin', 'layout');
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blocked slot:', error);
    return NextResponse.json({ error: 'Gagal menghapus blokir slot' }, { status: 500 });
  }
}
