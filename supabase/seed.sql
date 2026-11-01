-- ====================================================================
-- GRISELLA MAKEUP - SEED DATA
-- Default services, working hours, settings, message templates, sample data
-- ====================================================================

-- 1. MASTER LAYANAN (4 Layanan Utama Sesuai Spesifikasi)
INSERT INTO public.services (id, name, description, price, duration_minutes, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Bridesmaid Makeup', 'Makeup natural flawless glam untuk pendamping pengantin (termasuk hijab do / hair do standar).', 450000, 75, true),
    ('22222222-2222-2222-2222-222222222222', 'Wedding Makeup (Akad / Resepsi)', 'Rias pengantin premium tahan hingga 12 jam, complexion waterproof & retouch touch-up kit eksklusif.', 2500000, 180, true),
    ('33333333-3333-3333-3333-333333333333', 'Graduation / Wisuda Makeup', 'Fresh glowing look tahan seharian untuk momen wisuda, free pasang bulu mata premium.', 400000, 60, true),
    ('44444444-4444-4444-4444-444444444444', 'Lainnya (Custom Request)', 'Request makeup khusus (Photoshoot, Party, Sangjit, Panggung, dll). Durasi & harga dikonfirmasi oleh Admin.', 0, 90, true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_minutes = EXCLUDED.duration_minutes,
    is_active = EXCLUDED.is_active;

-- 2. JAM OPERASIONAL (Default 08.00 - 20.00 Setiap Hari)
INSERT INTO public.working_hours (day_of_week, start_time, end_time, is_active)
VALUES 
    (0, '08:00:00', '20:00:00', true), -- Minggu
    (1, '08:00:00', '20:00:00', true), -- Senin
    (2, '08:00:00', '20:00:00', true), -- Selasa
    (3, '08:00:00', '20:00:00', true), -- Rabu
    (4, '08:00:00', '20:00:00', true), -- Kamis
    (5, '08:00:00', '20:00:00', true), -- Jumat
    (6, '08:00:00', '20:00:00', true)  -- Sabtu
ON CONFLICT (day_of_week) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_active = EXCLUDED.is_active;

-- 3. PENGATURAN SISTEM
INSERT INTO public.settings (key, value, description)
VALUES 
    ('dp_percentage', '30', 'Persentase minimal Down Payment (%)'),
    ('buffer_studio_minutes', '30', 'Jeda waktu istirahat/persiapan antar job di Studio (menit)'),
    ('buffer_home_minutes', '60', 'Jeda waktu perjalanan antar job Home Service (menit)'),
    ('min_hours_same_day', '3', 'Minimal selisih jam pemesanan jika booking di hari yang sama (jam)'),
    ('studio_address', 'Jl. Melati Indah No. 18, Kebayoran Baru, Jakarta Selatan', 'Alamat resmi studio Grisella Makeup'),
    ('mua_whatsapp', '6281234567890', 'Nomor WhatsApp MUA aktif untuk konfirmasi & bantuan'),
    ('cancellation_policy', 'DP (Down Payment) yang telah dibayarkan bersifat non-refundable (tidak dapat dikembalikan) jika pemesanan dibatalkan secara sepihak oleh klien.', 'Teks kebijakan pembatalan pesanan'),
    ('transport_fee_zones', '[{"zone":"Jakarta Selatan & sekitarnya (<5 km)","fee":50000},{"zone":"Jakarta Pusat / Barat / Timur (5-15 km)","fee":100000},{"zone":"Tangerang / Depok / Bekasi / Luar Kota (>15 km)","fee":175000}]', 'Daftar pilihan estimasi tarif transport home service'),
    ('loyalty_vip_min_visits', '5', 'Batas minimal kunjungan selesai untuk status VIP'),
    ('loyalty_vip_min_spend', '2500000', 'Batas minimal total belanja selesai untuk status VIP (Rp)'),
    ('loyalty_regular_min_visits', '3', 'Batas minimal kunjungan selesai untuk status Langganan'),
    ('loyalty_lapsed_days', '90', 'Jumlah hari tanpa booking untuk label Hampir Hilang')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- 4. TEMPLATE PESAN WHATSAPP
INSERT INTO public.message_templates (code, title, body_template)
VALUES
    ('h_minus_1', 'Pengingat H-1 Jadwal Makeup', 'Halo kak {{nama}}! ✨ Mengingatkan kembali jadwal makeup di Grisella Makeup untuk besok {{tanggal}} pukul {{jam}} WIB (Lokasi: {{lokasi}}). Mohon bersihkan wajah dan istirahat yang cukup ya. Sampai jumpa besok! 💕'),
    ('pelunasan', 'Tagihan Pelunasan Sisa Biaya', 'Halo kak {{nama}}, terima kasih telah makeup bersama Grisella Makeup! ✨ Rincian sisa pelunasan sebesar Rp {{sisa_bayar}} dapat diserahkan langsung secara tunai atau ditransfer ke rekening BCA 123456789 a.n Grisella. Terima kasih banyak kak! 🙏'),
    ('terima_kasih', 'Ucapan Terima Kasih Pasca Layanan', 'Halo kak {{nama}}! ✨ Terima kasih banyak telah mempercayakan makeup di hari spesialnya kepada Grisella Makeup. Semoga suka dengan hasilnya ya kak. Boleh tag kami di IG @grisellamakeup. Have a wonderful day! 🌸'),
    ('hampir_hilang', 'Sapaan / Win-back Klien Lama', 'Hai kak {{nama}}! 💕 Udah kangen nih makeup-in kak {{nama}}. Grisella Makeup lagi ada slot kosong untuk minggu ini lho. Ada rencana acara spesial dalam waktu dekat? Yuk reservasi lagi lewat link: {{link_booking}} ✨')
ON CONFLICT (code) DO UPDATE SET
    title = EXCLUDED.title,
    body_template = EXCLUDED.body_template;

-- 5. CONTOH DATA KLIEN & BOOKING AWAL UNTUK PENGUJIAN CRM & KALENDER
INSERT INTO public.clients (id, name, phone, phone_normalized, skin_type, allergies, birthday, notes_shade, notes_lipstick, notes_favorite_style, source)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alya Putri Maharani', '081298765432', '+6281298765432', 'Kombinasi', 'Alergi minyak kelapa / komedogenik', '1998-05-14', 'Warm Beige / 02 Light Medium', 'Nude Peachy Satin', 'Soft Glam Indonesian', 'Instagram'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Clarissa Devina', '081311223344', '+6281311223344', 'Kering', 'Tidak ada', '2001-09-22', 'Ivory / 01 Fair', 'Rosy Pink Velvet', 'Korean Dewy Glow', 'TikTok')
ON CONFLICT (id) DO NOTHING;

-- Contoh booking aktif untuk pengujian slot kalender
INSERT INTO public.bookings (
    id, public_token, client_id, service_id, makeup_type, service_location, address,
    start_at, end_at, status, total_price, transport_fee, dp_amount, paid_dp_at, source
)
VALUES 
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'sample-token-wisuda-alya-2026',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '33333333-3333-3333-3333-333333333333',
        'Graduation',
        'studio',
        'Jl. Melati Indah No. 18, Jakarta Selatan',
        timezone('Asia/Jakarta', '2026-11-05 09:00:00')::timestamptz,
        timezone('Asia/Jakarta', '2026-11-05 10:00:00')::timestamptz,
        'dikonfirmasi',
        400000,
        0,
        120000,
        now(),
        'Instagram'
    )
ON CONFLICT (id) DO NOTHING;
