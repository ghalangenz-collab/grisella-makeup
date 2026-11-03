import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateBookingToken, normalizePhone } from '@/lib/utils';
import { getStoredServices, getStoredSettings, upsertStoredClient, upsertStoredBooking } from '@/lib/storage';
import { addMinutes, parse } from 'date-fns';
import { Booking } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      service_id,
      makeup_type,
      custom_request,
      service_location,
      address,
      address_benchmark,
      location_map_url,
      gps_latitude,
      gps_longitude,
      transport_fee = 0,
      date, // YYYY-MM-DD
      start_time, // HH:mm
      duration_minutes = 90,
      client_name,
      client_phone,
      notes,
      source,
    } = body;

    // 1. Validasi input wajib
    if (!client_name || !client_name.trim()) {
      return NextResponse.json({ error: 'Nama pemesan wajib diisi' }, { status: 400 });
    }

    if (!client_phone || !client_phone.trim()) {
      return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    if (!date || !start_time) {
      return NextResponse.json({ error: 'Tanggal dan jam wajib dipilih' }, { status: 400 });
    }

    if (makeup_type === 'Lainnya' && (!custom_request || !custom_request.trim())) {
      return NextResponse.json(
        { error: 'Untuk layanan "Lainnya", kolom "Makeup apa yang kamu inginkan?" wajib diisi' },
        { status: 400 }
      );
    }

    if (service_location === 'home' && (!address || !address.trim())) {
      return NextResponse.json(
        { error: 'Alamat lengkap wajib diisi untuk layanan Home Service' },
        { status: 400 }
      );
    }

    // 2. Normalisasi nomor WhatsApp
    const phoneNormalized = normalizePhone(client_phone);

    // 3. Hitung Waktu Mulai & Selesai (Format ISO dengan Offset WIB +07:00)
    const startDateTime = parse(`${date} ${start_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const endDateTime = addMinutes(startDateTime, duration_minutes);

    const startAtISO = `${date}T${start_time}:00+07:00`;
    const endHour = String(endDateTime.getHours()).padStart(2, '0');
    const endMin = String(endDateTime.getMinutes()).padStart(2, '0');
    const endAtISO = `${date}T${endHour}:${endMin}:00+07:00`;

    // 4. Hitung Harga & DP dari stored services & stored settings
    const storedServices = getStoredServices();
    const storedSettings = getStoredSettings();

    let price = 0;
    let selectedService = null;

    const isCustom =
      (makeup_type || '').toLowerCase().includes('lainnya') ||
      (custom_request && custom_request.trim().length > 0 && !service_id);

    if (!isCustom) {
      selectedService = storedServices.find(
        (s) => s.id === service_id || s.name.toLowerCase() === (makeup_type || '').toLowerCase()
      );
      price = selectedService ? selectedService.price : 450000;
    }

    const transportAmount = service_location === 'home' ? Number(transport_fee) || 0 : 0;
    const totalPrice = isCustom || price === 0 ? 0 : price + transportAmount;

    const dpPercentage = parseInt(storedSettings.dp_percentage || '30', 10);
    const dpAmount = isCustom || totalPrice === 0 ? 0 : Math.round((totalPrice * dpPercentage) / 100);

    const status = isCustom || totalPrice === 0 ? 'menunggu_konfirmasi' : 'menunggu_pembayaran';
    const publicToken = generateBookingToken();
    const expiresAt = isCustom || totalPrice === 0 ? null : new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Pastikan benchmark memuat info GPS link jika ada, sebagai fallback permanen
    let benchmarkWithGps = address_benchmark || '';
    if (location_map_url && !benchmarkWithGps.includes(location_map_url)) {
      benchmarkWithGps = benchmarkWithGps
        ? `${benchmarkWithGps} | Pin GPS: ${location_map_url}`
        : `Pin GPS: ${location_map_url}`;
    }

    // 5. Upsert Data Klien ke local storage
    const savedClient = upsertStoredClient({
      name: client_name.trim(),
      phone: client_phone.trim(),
      phone_normalized: phoneNormalized,
      source: source || 'Lainnya',
    });

    const clientId = savedClient.id;

    // 6. Simpan Booking ke local storage
    const newBooking: Booking = {
      id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      public_token: publicToken,
      client_id: clientId,
      service_id: service_id || (selectedService ? selectedService.id : null),
      makeup_type,
      custom_request: custom_request || null,
      service_location,
      address: service_location === 'home' ? address : (storedSettings.studio_address || 'Studio Grisella Makeup'),
      address_benchmark: benchmarkWithGps || null,
      location_map_url: location_map_url || null,
      gps_latitude: gps_latitude !== undefined ? gps_latitude : null,
      gps_longitude: gps_longitude !== undefined ? gps_longitude : null,
      notes: notes || null,
      start_at: startAtISO,
      end_at: endAtISO,
      status,
      total_price: totalPrice,
      transport_fee: transportAmount,
      dp_amount: dpAmount,
      paid_dp_at: null,
      paid_settlement_at: null,
      settlement_amount: 0,
      settlement_method: null,
      payment_receipt_url: null,
      payment_receipt_uploaded_at: null,
      payment_bank_name: null,
      payment_sender_name: null,
      source: source || 'Lainnya',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client: savedClient,
      service: selectedService || undefined,
    };

    upsertStoredBooking(newBooking);

    // 7. Sinkronisasi ke Supabase (Database Utama untuk sinkron multi-device HP/laptop/tab)
    try {
      const supabase = createAdminClient();

      // Dapatkan atau buat client di Supabase dengan UUID yang valid
      let sbClientId: string | null = null;
      try {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('phone_normalized', phoneNormalized)
          .maybeSingle();

        if (existingClient?.id) {
          sbClientId = existingClient.id;
          await supabase
            .from('clients')
            .update({ name: client_name.trim(), updated_at: new Date().toISOString() })
            .eq('id', sbClientId);
        } else {
          const generatedClientId = crypto.randomUUID();
          const { data: newClient, error: clientInsertErr } = await supabase
            .from('clients')
            .insert({
              id: generatedClientId,
              name: client_name.trim(),
              phone: client_phone.trim(),
              phone_normalized: phoneNormalized,
              source: source || 'Lainnya',
            })
            .select('id')
            .maybeSingle();

          if (newClient?.id) {
            sbClientId = newClient.id;
          } else {
            console.warn('Supabase client insert failed, trying lookup:', clientInsertErr?.message);
            const { data: fallbackClient } = await supabase
              .from('clients')
              .select('id')
              .eq('phone_normalized', phoneNormalized)
              .maybeSingle();
            sbClientId = fallbackClient?.id || generatedClientId;
          }
        }
      } catch (clientErr) {
        console.warn('Supabase client upsert error:', clientErr);
      }

      if (sbClientId) {
        // Cek apakah service_id valid dan ada di Supabase untuk mencegah foreign key violation
        let validServiceId: string | null = null;
        if (service_id) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(service_id);
          if (isUuid) {
            try {
              const { data: svcExists } = await supabase
                .from('services')
                .select('id')
                .eq('id', service_id)
                .maybeSingle();
              if (svcExists?.id) {
                validServiceId = svcExists.id;
              }
            } catch (svcErr) {
              console.warn('Check service_id in Supabase error:', svcErr);
            }
          }
        }

        // Coba insert booking dengan semua kolom GPS
        const bookingPayload: Record<string, any> = {
          public_token: publicToken,
          client_id: sbClientId,
          service_id: validServiceId,
          makeup_type,
          custom_request: custom_request || null,
          service_location,
          address: newBooking.address,
          address_benchmark: benchmarkWithGps || null,
          notes: notes || null,
          start_at: startAtISO,
          end_at: endAtISO,
          status,
          total_price: totalPrice,
          transport_fee: transportAmount,
          dp_amount: dpAmount,
          source: source || 'Lainnya',
          expires_at: expiresAt,
          location_map_url: location_map_url || null,
          gps_latitude: gps_latitude !== undefined ? gps_latitude : null,
          gps_longitude: gps_longitude !== undefined ? gps_longitude : null,
        };

        const { error: bookingInsertErr } = await supabase.from('bookings').insert(bookingPayload);

        // Jika gagal karena kolom baru belum dimigrasi di remote, retry dengan kolom standar
        if (bookingInsertErr) {
          console.warn('Retrying insert without optional GPS columns:', bookingInsertErr.message);
          const fallbackPayload = {
            public_token: publicToken,
            client_id: sbClientId,
            service_id: validServiceId,
            makeup_type,
            custom_request: custom_request || null,
            service_location,
            address: newBooking.address,
            address_benchmark: benchmarkWithGps || null,
            notes: notes || null,
            start_at: startAtISO,
            end_at: endAtISO,
            status,
            total_price: totalPrice,
            transport_fee: transportAmount,
            dp_amount: dpAmount,
            source: source || 'Lainnya',
            expires_at: expiresAt,
          };
          const { error: retryErr } = await supabase.from('bookings').insert(fallbackPayload);
          if (retryErr) {
            console.warn('Fallback insert with validServiceId failed, trying with service_id null:', retryErr.message);
            await supabase.from('bookings').insert({
              ...fallbackPayload,
              service_id: null,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Supabase booking sync skipped:', e);
    }

    return NextResponse.json(
      {
        success: true,
        token: publicToken,
        redirect_url: `/booking/${publicToken}`,
        booking: {
          public_token: publicToken,
          makeup_type,
          status,
          date,
          start_time,
          service_location,
          total_price: totalPrice,
          dp_amount: dpAmount,
          expires_at: expiresAt,
          location_map_url,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Booking creation fatal error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat membuat booking' }, { status: 500 });
  }
}
