import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { upsertStoredService, deleteStoredService } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const priceNum =
      body.price !== undefined
        ? Number(String(body.price).replace(/[^0-9]/g, ''))
        : undefined;
    const durationNum =
      body.duration_minutes !== undefined
        ? Number(String(body.duration_minutes).replace(/[^0-9]/g, ''))
        : undefined;

    // 1. Update in local storage
    const updated = upsertStoredService({
      id,
      name: body.name !== undefined ? String(body.name).trim() : undefined,
      category: body.category !== undefined ? String(body.category).trim() : undefined,
      description: body.description !== undefined ? String(body.description).trim() : undefined,
      price: priceNum,
      duration_minutes: durationNum,
      image_url: body.image_url !== undefined ? (body.image_url ? String(body.image_url).trim() : null) : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
    });

    // 2. Best-effort Supabase sync with proper error checking
    try {
      const supabase = createAdminClient();
      const { error: updateErr } = await supabase
        .from('services')
        .update({
          name: updated.name,
          category: updated.category,
          description: updated.description,
          price: updated.price,
          duration_minutes: updated.duration_minutes,
          image_url: updated.image_url,
          is_active: updated.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateErr) {
        console.warn('Supabase service update with new columns failed, retrying base:', updateErr.message);
        await supabase
          .from('services')
          .update({
            name: updated.name,
            description: updated.description,
            price: updated.price,
            duration_minutes: updated.duration_minutes,
            is_active: updated.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      }
    } catch (e) {
      console.warn('Supabase service update sync skipped:', e);
    }

    // 3. Purge router cache across booking and admin pages
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin', 'layout');
    } catch {}

    return NextResponse.json({ success: true, service: updated });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Gagal memperbarui layanan' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteStoredService(id);

    try {
      const supabase = createAdminClient();
      await Promise.race([
        supabase.from('services').delete().eq('id', id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
      ]);
    } catch (e) {
      console.warn('Supabase service delete sync skipped:', e);
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin', 'layout');
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Gagal menghapus layanan' }, { status: 500 });
  }
}
