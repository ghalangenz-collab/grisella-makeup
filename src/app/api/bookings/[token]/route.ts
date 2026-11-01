import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStoredBookingByToken, updateStoredBooking, getStoredSettings } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token booking tidak valid' }, { status: 400 });
    }

    // 1. Try local JSON storage first (fast, reliable, always persistent)
    let bookingData = getStoredBookingByToken(token);

    // 2. Try Supabase as sync/enhancement
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:clients (
            id,
            name,
            phone,
            phone_normalized
          ),
          service:services (
            id,
            name,
            description,
            price,
            duration_minutes
          )
        `)
        .eq('public_token', token)
        .maybeSingle();

      if (data && !error) {
        bookingData = { ...bookingData, ...data };
      }
    } catch {
      // Supabase offline/error, proceed with local data
    }

    if (!bookingData) {
      return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
    }

    const settings = getStoredSettings();

    return NextResponse.json({
      booking: bookingData,
      settings,
    });
  } catch (error) {
    console.error('Error in booking token API:', error);
    return NextResponse.json({ error: 'Gagal memuat data booking' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { payment_receipt_url, payment_sender_name, payment_bank_name } = body;

    if (!payment_receipt_url) {
      return NextResponse.json({ error: 'Bukti transfer wajib diunggah' }, { status: 400 });
    }

    const updates = {
      status: 'menunggu_verifikasi' as const,
      payment_receipt_url,
      payment_sender_name: payment_sender_name || null,
      payment_bank_name: payment_bank_name || null,
      payment_receipt_uploaded_at: new Date().toISOString(),
    };

    // 1. Update in local storage
    const updated = updateStoredBooking(token, updates);

    // 2. Best-effort update to Supabase
    try {
      const supabase = createAdminClient();
      await supabase
        .from('bookings')
        .update({
          status: 'menunggu_verifikasi',
          updated_at: new Date().toISOString(),
        })
        .eq('public_token', token);
    } catch (e) {
      console.warn('Supabase booking update skipped:', e);
    }

    return NextResponse.json({
      success: true,
      booking: updated,
    });
  } catch (error) {
    console.error('Error submitting payment receipt:', error);
    return NextResponse.json({ error: 'Gagal menyimpan bukti pembayaran' }, { status: 500 });
  }
}
