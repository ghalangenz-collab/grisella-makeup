import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { upsertStoredClient } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. Update in local storage
    const updated = upsertStoredClient({
      id,
      name: body.name || 'Klien',
      phone: body.phone,
      skin_type: body.skin_type,
      allergies: body.allergies,
      birthday: body.birthday || null,
      notes_shade: body.notes_shade,
      notes_lipstick: body.notes_lipstick,
      notes_favorite_style: body.notes_favorite_style,
    });

    // 2. Best-effort Supabase sync with 1.5s timeout
    try {
      const supabase = createAdminClient();
      await Promise.race([
        supabase
          .from('clients')
          .update({
            skin_type: body.skin_type,
            allergies: body.allergies,
            birthday: body.birthday || null,
            notes_shade: body.notes_shade,
            notes_lipstick: body.notes_lipstick,
            notes_favorite_style: body.notes_favorite_style,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
      ]);
    } catch (e) {
      console.warn('Supabase client update skipped:', e);
    }

    try {
      revalidatePath('/admin/klien', 'page');
    } catch {}

    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error('Client update error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui profil klien' }, { status: 500 });
  }
}
