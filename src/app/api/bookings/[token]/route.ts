import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStoredBookingByToken, updateStoredBooking } from '@/lib/storage';
import { getSystemSettings } from '@/lib/services';

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

    // 1. Coba ambil dari local storage
    let bookingData = getStoredBookingByToken(token);

    // 2. Coba ambil dan perbarui dengan data Supabase (agar sinkron di semua device)
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

    const settings = await getSystemSettings();

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

    const uploadedAt = new Date().toISOString();
    const updates = {
      status: 'menunggu_verifikasi' as const,
      payment_receipt_url,
      payment_sender_name: payment_sender_name || null,
      payment_bank_name: payment_bank_name || null,
      payment_receipt_uploaded_at: uploadedAt,
    };

    // 1. Update in local storage
    const updated = updateStoredBooking(token, updates);

    // 2. Update to Supabase (Database multi-device)
    try {
      const supabase = createAdminClient();

      const fullUpdatePayload: Record<string, any> = {
        status: 'menunggu_verifikasi',
        payment_receipt_url,
        payment_sender_name: payment_sender_name || null,
        payment_bank_name: payment_bank_name || null,
        payment_receipt_uploaded_at: uploadedAt,
        updated_at: uploadedAt,
      };

      const { error: sbUpdateErr } = await supabase
        .from('bookings')
        .update(fullUpdatePayload)
        .eq('public_token', token);

      if (sbUpdateErr) {
        console.warn('Supabase full update failed, retrying with fallback note:', sbUpdateErr.message);
        // Fallback 1: Coba dengan status 'menunggu_verifikasi' dan note (jangan timpa note lama jika ada)
        const baseNote = updated?.notes ? `${updated.notes}\n` : '';
        const noteAppend = `${baseNote}[BUKTI DP: ${payment_receipt_url} | ${payment_bank_name || 'Bank'} a.n ${payment_sender_name || 'Klien'}]`;
        const { error: err2 } = await supabase
          .from('bookings')
          .update({
            status: 'menunggu_verifikasi',
            notes: noteAppend,
            updated_at: uploadedAt,
          })
          .eq('public_token', token);

        // Fallback 2: Jika check constraint database menolak 'menunggu_verifikasi', fallback ke 'menunggu_konfirmasi'
        if (err2) {
          console.warn('Supabase status check constraint fallback:', err2.message);
          await supabase
            .from('bookings')
            .update({
              status: 'menunggu_konfirmasi',
              notes: noteAppend,
              updated_at: uploadedAt,
            })
            .eq('public_token', token);
        }
      }
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
