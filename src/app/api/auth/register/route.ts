import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { upsertStoredClient, saveStoredUserAccount } from '@/lib/storage';
import { normalizePhone } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

function hashPassword(pwd: string): string {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

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

    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseAnonKey();

    // 1. Simpan selalu ke stored user account dengan hash password
    const localUserId = `usr-${Date.now()}`;
    const passwordHash = hashPassword(String(password));
    saveStoredUserAccount({
      id: localUserId,
      email: cleanEmail,
      fullName: name,
      phone: String(phone),
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    // 2. Simpan juga ke stored client & database clients Supabase
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

    // 3. Daftarkan juga ke Supabase Auth REST API
    let sbUserId: string | null = null;
    let isAutoConfirmed = false;

    try {
      const sbRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
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

      if (sbRes.ok) {
        sbUserId = data.id || data.user?.id || null;
        isAutoConfirmed = Boolean(data.session && data.user);
      } else {
        const msg = data.msg || data.error_description || data.message || '';
        if (msg.toLowerCase().includes('already registered')) {
          return NextResponse.json(
            { error: 'Email ini sudah terdaftar. Silakan pilih tab "Masuk (Login)".' },
            { status: 409 }
          );
        }
        console.warn('Supabase auth signup notice:', msg);
        // Jika rate limit email terlampaui di Supabase, akun lokal tetap aktif langsung
        isAutoConfirmed = true;
      }
    } catch (sbErr) {
      console.warn('Supabase signup request skipped:', sbErr);
      isAutoConfirmed = true;
    }

    return NextResponse.json({
      success: true,
      isAutoConfirmed: true, // Langsung aktifkan agar user tidak terhambat email quota
      user: {
        id: sbUserId || localUserId,
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
