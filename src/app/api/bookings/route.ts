import { NextRequest, NextResponse } from 'next/server';
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

    if (makeup_type !== 'Lainnya') {
      selectedService = storedServices.find((s) => s.id === service_id || s.name.toLowerCase().includes(makeup_type.toLowerCase()));
      price = selectedService ? selectedService.price : 400000;
    }

    const transportAmount = service_location === 'home' ? Number(transport_fee) || 0 : 0;
    const totalPrice = makeup_type === 'Lainnya' ? 0 : price + transportAmount;

    const dpPercentage = parseInt(storedSettings.dp_percentage || '30', 10);
    const dpAmount = makeup_type === 'Lainnya' ? 0 : Math.round((totalPrice * dpPercentage) / 100);

    const isCustom = makeup_type === 'Lainnya';
    const status = isCustom ? 'menunggu_konfirmasi' : 'menunggu_pembayaran';
    const publicToken = generateBookingToken();
    const expiresAt = isCustom ? null : new Date(Date.now() + 30 * 60 * 1000).toISOString();

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
      address_benchmark: address_benchmark || null,
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

    // 7. Best-effort Supabase sync (tidak memblokir flow jika Supabase offline/error)
    try {
      const supabase = createAdminClient();
      await supabase.from('clients').upsert({
        name: client_name.trim(),
        phone: client_phone.trim(),
        phone_normalized: phoneNormalized,
        source: source || 'Lainnya',
      });

      await supabase.from('bookings').insert({
        public_token: publicToken,
        client_id: clientId,
        service_id: service_id || null,
        makeup_type,
        custom_request: custom_request || null,
        service_location,
        address: newBooking.address,
        address_benchmark: address_benchmark || null,
        notes: notes || null,
        start_at: startAtISO,
        end_at: endAtISO,
        status,
        total_price: totalPrice,
        transport_fee: transportAmount,
        dp_amount: dpAmount,
        source: source || 'Lainnya',
        expires_at: expiresAt,
      });
    } catch (e) {
      console.warn('Supabase booking sync skipped:', e);
    }

    return NextResponse.json({
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
      },
    });
  } catch (error) {
    console.error('Booking creation fatal error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat membuat booking' }, { status: 500 });
  }
}
