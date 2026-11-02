import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStoredBookings, getStoredClients, getStoredServices, upsertStoredBooking } from '@/lib/storage';
import { Booking } from '@/types/database';

export const dynamic = 'force-dynamic';

function enrichBookingGpsAndReceipt(b: any): Booking {
  // Parsing fallback jika receipt tersimpan dalam notes
  let payment_receipt_url = b.payment_receipt_url || null;
  let payment_bank_name = b.payment_bank_name || null;
  let payment_sender_name = b.payment_sender_name || null;

  if (!payment_receipt_url && b.notes && b.notes.includes('[BUKTI DP:')) {
    const match = b.notes.match(/\[BUKTI DP:\s*([^|\]]+)(?:\|\s*([^|\]]+))?(?:\|\s*([^|\]]+))?\]/);
    if (match) {
      payment_receipt_url = match[1]?.trim() || null;
      if (match[2]) payment_bank_name = match[2]?.trim();
      if (match[3]) payment_sender_name = match[3]?.trim();
    }
  }

  // Parsing fallback jika link GPS ada di address_benchmark
  let location_map_url = b.location_map_url || null;
  if (!location_map_url && b.address_benchmark) {
    const matchGps = b.address_benchmark.match(/(https?:\/\/[^\s|]+(?:google\.com\/maps|maps\.app\.goo\.gl)[^\s|]*)/);
    if (matchGps) {
      location_map_url = matchGps[1];
    }
  }

  // Status otomatis dipromosikan ke 'menunggu_verifikasi' jika ada bukti DP dan belum dikonfirmasi
  let status = b.status;
  if (
    payment_receipt_url &&
    !b.paid_dp_at &&
    status !== 'dikonfirmasi' &&
    status !== 'selesai' &&
    status !== 'batal'
  ) {
    status = 'menunggu_verifikasi';
  }

  return {
    ...b,
    status,
    payment_receipt_url,
    payment_bank_name,
    payment_sender_name,
    location_map_url,
  };
}

export async function GET() {
  try {
    const localBookings = getStoredBookings();
    const clients = getStoredClients();
    const services = getStoredServices();

    // Map by public_token or id to prevent duplicate entries
    const bookingMap = new Map<string, Booking>();

    // 1. Masukkan local bookings terlebih dahulu
    localBookings.forEach((b) => {
      const enriched = enrichBookingGpsAndReceipt({
        ...b,
        client: b.client || clients.find((c) => c.id === b.client_id),
        service: b.service || services.find((s) => s.id === b.service_id),
      });
      const key = b.public_token || b.id;
      bookingMap.set(key, enriched);
    });

    // 2. Ambil dari Supabase (database utama real-time & sinkron multi-device)
    try {
      const supabase = createAdminClient();
      const { data: supabaseBookings, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (!error && supabaseBookings && supabaseBookings.length > 0) {
        supabaseBookings.forEach((sb: any) => {
          const enriched = enrichBookingGpsAndReceipt(sb);
          const key = sb.public_token || sb.id;
          bookingMap.set(key, enriched);
          // Sync ke storage lokal
          upsertStoredBooking(enriched);
        });
      }
    } catch (e) {
      console.warn('Supabase admin bookings fetch skipped:', e);
    }

    // Ambil unique list terurut berdasarkan tanggal
    const uniqueBookings = Array.from(bookingMap.values()).sort(
      (a, b) => new Date(b.start_at || b.created_at).getTime() - new Date(a.start_at || a.created_at).getTime()
    );

    return NextResponse.json({ bookings: uniqueBookings });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json({ bookings: [] });
  }
}
