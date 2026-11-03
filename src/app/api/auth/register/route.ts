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
    const { fullName, phone, email, password } = await request.json();

    if (!fullName || !phone || !email || !password) {
      return NextResponse.json(
        { error: 'Semua kolom (Nama, WhatsApp, Email, Password) wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanPhone = normalizePhone(String(phone));
    const name = String(fullName).trim();

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // 1. Daftarkan user ke Supabase Auth REST API
    const sbRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: String(password),
        data: {
          full_name: name,
          phone: cleanPhone,
          role: 'user',
        },
      }),
    });

    const data = await sbRes.json();

    if (!sbRes.ok) {
      const msg = data.msg || data.error_description || data.message || '';
      if (msg.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { error: 'Email ini sudah terdaftar. Silakan pilih tab "Masuk (Login)".' },
          { status: 409 }
        );
      }
      if (msg.toLowerCase().includes('invalid')) {
        return NextResponse.json(
          { error: 'Format alamat email tidak valid.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: msg || 'Gagal mendaftarkan akun ke Supabase.' },
        { status: 400 }
      );
    }

    // 2. Simpan profil ke clients table & storage
    try {
      upsertStoredClient({
        name,
        phone: String(phone),
        phone_normalized: cleanPhone,
        source: 'Registrasi Akun Pelanggan',
        notes_favorite_style: `User Akun Pelanggan: ${cleanEmail}`,
      });

      const adminSupabase = createAdminClient();
      await adminSupabase.from('clients').insert({
        name,
        phone: String(phone),
        phone_normalized: cleanPhone,
        source: 'Registrasi Akun Pelanggan',
        notes_favorite_style: `User Akun Pelanggan: ${cleanEmail}`,
      });
    } catch (syncErr) {
      console.warn('Sync client on register skipped:', syncErr);
    }

    const isAutoConfirmed = Boolean(data.session && data.user);

    return NextResponse.json({
      success: true,
      isAutoConfirmed,
      user: {
        id: data.id || data.user?.id,
        email: cleanEmail,
        full_name: name,
        phone: String(phone),
        role: 'user',
      },
    });
  } catch (error: any) {
    console.error('Server register error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat mendaftar. Silakan coba beberapa saat lagi.' },
      { status: 500 }
    );
  }
}
