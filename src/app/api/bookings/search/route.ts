import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStoredBookings, getStoredClients } from '@/lib/storage';
import { normalizePhone, enrichBookingGpsAndReceipt } from '@/lib/utils';
import { Booking } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({ bookings: [] });
    }

    const cleanPhone = normalizePhone(query);
    const resultsMap = new Map<string, Booking>();

    // 1. Cari dari local storage
    const localBookings = getStoredBookings();
    const clients = getStoredClients();

    localBookings.forEach((b) => {
      const client = b.client || clients.find((c) => c.id === b.client_id);
      const phone = client?.phone_normalized || client?.phone || '';
      const name = client?.name || '';
      const token = b.public_token || '';

      const match =
        token.toLowerCase().includes(query.toLowerCase()) ||
        b.id.toLowerCase().includes(query.toLowerCase()) ||
        phone.includes(cleanPhone) ||
        (query.length >= 4 && phone.includes(query)) ||
        name.toLowerCase().includes(query.toLowerCase());

      if (match) {
        const enriched = enrichBookingGpsAndReceipt({ ...b, client });
        resultsMap.set(b.public_token || b.id, enriched);
      }
    });

    // 2. Cari dari Supabase (Cloud multi-device)
    try {
      const supabase = createAdminClient();
      let sbQuery = supabase
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
        .order('created_at', { ascending: false })
        .limit(10);

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
      if (isUuid) {
        sbQuery = sbQuery.eq('id', query);
      } else if (query.startsWith('grs_')) {
        sbQuery = sbQuery.eq('public_token', query);
      }

      const { data, error } = await sbQuery;

      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          const clientPhone = row.client?.phone_normalized || row.client?.phone || '';
          const clientName = row.client?.name || '';
          const token = row.public_token || '';

          const match =
            token.toLowerCase().includes(query.toLowerCase()) ||
            row.id.toLowerCase().includes(query.toLowerCase()) ||
            clientPhone.includes(cleanPhone) ||
            (query.length >= 4 && clientPhone.includes(query)) ||
            clientName.toLowerCase().includes(query.toLowerCase());

          if (match) {
            const enriched = enrichBookingGpsAndReceipt(row);
            resultsMap.set(row.public_token || row.id, enriched);
          }
        });
      }
    } catch (e) {
      console.warn('Supabase booking search skipped:', e);
    }

    const bookings = Array.from(resultsMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(
      { bookings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in search bookings:', error);
    return NextResponse.json({ bookings: [] });
  }
}
