import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { upsertStoredClient, findStoredUserAccount } from '@/lib/storage';
import { normalizePhone } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/config';
import { findCloudUserAccount } from '@/lib/cloud-users';

export const dynamic = 'force-dynamic';

function hashPassword(pwd: string): string {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

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
    const inputPassword = String(password);
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseAnonKey();

    // 1. Coba verifikasi kredensial ke Supabase Auth REST API
    let sbUser: any = null;
    let sbNeedsOtp = false;

    try {
      const sbRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: inputPassword,
        }),
      });

      const data = await sbRes.json();

      if (sbRes.ok && data.user) {
        sbUser = data.user;
      } else {
        const msg = data.msg || data.error_description || data.message || '';
        if (msg.toLowerCase().includes('email not confirmed')) {
          sbNeedsOtp = true;
        }
      }
    } catch (sbErr) {
      console.warn('Supabase auth check connection notice:', sbErr);
    }

    // Jika Supabase berhasil memverifikasi kredensial
    if (sbUser) {
      const metadata = sbUser.user_metadata || {};
      const fullName = metadata.full_name || cleanEmail.split('@')[0];
      const phone = metadata.phone || '';

      try {
        const cleanPhone = phone ? normalizePhone(phone) : '';
        upsertStoredClient({
          name: fullName,
          phone: phone || '08',
          phone_normalized: cleanPhone || '08',
          source: 'Login Akun Pelanggan',
          notes_favorite_style: `User Akun Pelanggan: ${cleanEmail}`,
        });
      } catch (syncErr) {
        console.warn('Client sync notice:', syncErr);
      }

      return NextResponse.json({
        success: true,
        user: {
          id: sbUser.id,
          email: cleanEmail,
          full_name: fullName,
          phone: phone,
          role: 'user',
        },
      });
    }

    // 2. Cek akun Cloud Database Supabase (berlaku untuk SEMUA device: HP, Laptop, dll)
    const cloudAccount = await findCloudUserAccount(cleanEmail);
    const targetAccount = cloudAccount || findStoredUserAccount(cleanEmail);

    if (targetAccount) {
      const inputHash = hashPassword(inputPassword);
      if (inputHash === targetAccount.passwordHash) {
        // Password COCOK! Izinkan masuk di device manapun
        return NextResponse.json({
          success: true,
          user: {
            id: targetAccount.id,
            email: cleanEmail,
            full_name: targetAccount.fullName,
            phone: targetAccount.phone,
            role: 'user',
          },
        });
      } else {
        // Password SALAH! Tolak tegas
        return NextResponse.json(
          { error: 'Email atau password yang kamu masukkan salah.' },
          { status: 401 }
        );
      }
    }

    // 3. Jika Supabase membutuhkan OTP verifikasi
    if (sbNeedsOtp) {
      return NextResponse.json(
        {
          error: 'Email kamu belum diverifikasi. Masukkan 6 digit kode OTP yang dikirim ke Gmail kamu.',
          needs_otp: true,
        },
        { status: 403 }
      );
    }

    // 3. Jika tidak ditemukan atau kredensial salah: TOLAK TEGAS
    return NextResponse.json(
      { error: 'Email atau password yang kamu masukkan salah.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Server login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses login. Silakan coba beberapa saat lagi.' },
      { status: 500 }
    );
  }
}
