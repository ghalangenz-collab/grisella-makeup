import { NextRequest, NextResponse } from 'next/server';
import { upsertStoredClient } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lzucxgbxvixlybpwbodh.supabase.co';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_bTnZiVyO9Vx3DyG4UyR_7Q_yIYkJS6Q';

export async function POST(request: NextRequest) {
  try {
    const { email, token, type } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email dan 6 digit kode OTP wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanToken = String(token).trim();

    // 1. Coba verify dengan type yang diminta (signup atau email)
    const primaryType = type === 'email' ? 'email' : 'signup';
    let sbRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        token: cleanToken,
        type: primaryType,
      }),
    });

    let data = await sbRes.json();

    // Jika gagal, coba type alternatif
    if (!sbRes.ok) {
      const altType = primaryType === 'signup' ? 'email' : 'signup';
      const altRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          token: cleanToken,
          type: altType,
        }),
      });

      if (altRes.ok) {
        sbRes = altRes;
        data = await altRes.json();
      }
    }

    if (!sbRes.ok) {
      return NextResponse.json(
        { error: 'Kode OTP tidak valid atau sudah kedaluwarsa. Silakan periksa kembali Gmail Anda.' },
        { status: 401 }
      );
    }

    const user = data.user;
    const metadata = user?.user_metadata || {};
    const fullName = metadata.full_name || cleanEmail.split('@')[0];
    const phone = metadata.phone || '';

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id || `usr-${Date.now()}`,
        email: cleanEmail,
        full_name: fullName,
        phone: phone,
        role: 'user',
      },
    });
  } catch (error: any) {
    console.error('Server OTP verify error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memverifikasi kode OTP.' },
      { status: 500 }
    );
  }
}
