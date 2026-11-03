import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lzucxgbxvixlybpwbodh.supabase.co';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_bTnZiVyO9Vx3DyG4UyR_7Q_yIYkJS6Q';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Alamat email wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();

    const sbRes = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
      }),
    });

    const data = await sbRes.json();

    if (!sbRes.ok) {
      const msg = data.msg || data.message || 'Gagal mengirim kode OTP.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Kode OTP verifikasi telah dikirim ke ${cleanEmail}`,
    });
  } catch (error: any) {
    console.error('Server OTP request error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat meminta OTP.' },
      { status: 500 }
    );
  }
}
