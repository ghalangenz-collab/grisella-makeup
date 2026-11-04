import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { upsertStoredClient } from '@/lib/storage';
import { normalizePhone } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auth_id, full_name, email, phone } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone ? normalizePhone(phone) : '';
    const name = full_name ? String(full_name).trim() : cleanEmail.split('@')[0];

    // 1. Simpan di local storage
    const localClient = upsertStoredClient({
      name,
      phone: phone || cleanPhone || '08',
      phone_normalized: cleanPhone || '08',
      source: 'Registrasi Akun Pelanggan',
      notes_favorite_style: `User Akun Pelanggan: ${cleanEmail}`,
    });

    // 2. Simpan / Sinkronkan ke Supabase clients table
    try {
      const supabase = createAdminClient();

      // Cek apakah client sudah ada berdasarkan nomor telepon atau query
      let sbClientId: string | null = null;
      if (cleanPhone) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('phone_normalized', cleanPhone)
          .maybeSingle();

        if (existing?.id) {
          sbClientId = existing.id;
          await supabase
            .from('clients')
            .update({
              name,
              notes: `User Akun Pelanggan: ${cleanEmail}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sbClientId);
        }
      }

      if (!sbClientId) {
        const { data: newClient } = await supabase
          .from('clients')
          .insert({
            name,
            phone: phone || cleanPhone || '-',
            phone_normalized: cleanPhone || '-',
            source: 'Registrasi Akun Pelanggan',
            notes: `User Akun Pelanggan: ${cleanEmail}`,
          })
          .select('id')
          .single();

        if (newClient?.id) {
          sbClientId = newClient.id;
        }
      }
    } catch (e) {
      console.warn('Supabase sync-user client upsert skipped:', e);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: auth_id || localClient.id,
        full_name: name,
        email: cleanEmail,
        phone: phone || '',
        role: 'user',
      },
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Gagal menyinkronkan data user' }, { status: 500 });
  }
}
