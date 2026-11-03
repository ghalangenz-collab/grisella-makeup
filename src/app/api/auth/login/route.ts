import { NextRequest, NextResponse } from 'next/server';
import { upsertStoredClient } from '@/lib/storage';
import { normalizePhone } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lzucxgbxvixlybpwbodh.supabase.co';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_bTnZiVyO9Vx3DyG4UyR_7Q_yIYkJS6Q';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // 1. Verifikasi kredensial langsung ke Supabase Auth REST API
    const sbRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: String(password),
      }),
    });

    const data = await sbRes.json();

    if (!sbRes.ok) {
      const msg = data.msg || data.error_description || data.message || '';
      if (
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('credential') ||
        data.error_code === 'invalid_credentials'
      ) {
        return NextResponse.json(
          { error: 'Email atau password yang kamu masukkan salah.' },
          { status: 401 }
        );
      }
      if (msg.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json(
          {
            error: 'Email kamu belum diverifikasi. Silakan masukkan 6 digit kode OTP yang dikirim ke Gmail kamu.',
            needs_otp: true,
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: msg || 'Gagal masuk ke akun. Periksa kembali email dan password kamu.' },
        { status: 400 }
      );
    }

    const user = data.user;
    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password yang kamu masukkan salah.' },
        { status: 401 }
      );
    }

    const metadata = user.user_metadata || {};
    const fullName = metadata.full_name || cleanEmail.split('@')[0];
    const phone = metadata.phone || '';

    // 2. Sinkronkan profil ke clients table & local storage
    try {
      const cleanPhone = phone ? normalizePhone(phone) : '';
      upsertStoredClient({
        name: fullName,
        phone: phone || '08',
        phone_normalized: cleanPhone || '08',
        source: 'Login Akun Pelanggan',
        notes_favorite_style: `User Akun Pelanggan: ${cleanEmail}`,
      });

      const adminSupabase = createAdminClient();
      if (cleanPhone) {
        const { data: existing } = await adminSupabase
          .from('clients')
          .select('id')
          .eq('phone_normalized', cleanPhone)
          .maybeSingle();

        if (existing?.id) {
          await adminSupabase
            .from('clients')
            .update({
              name: fullName,
              notes_favorite_style: `User Akun Pelanggan: ${cleanEmail}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        }
      }
    } catch (syncErr) {
      console.warn('Sync client record on login skipped:', syncErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: cleanEmail,
        full_name: fullName,
        phone: phone,
        role: 'user',
      },
    });
  } catch (error: any) {
    console.error('Server login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses login. Silakan coba beberapa saat lagi.' },
      { status: 500 }
    );
  }
}
