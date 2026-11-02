-- ====================================================================
-- GRISELLA MAKEUP - MIGRATION 2026-11-02
-- 1. Dukungan Sub-Paket & Foto Layanan
-- 2. Status Menunggu Verifikasi DP & Kolom Struk Bukti Transfer
-- 3. Titik Koordinat GPS Google Maps untuk Home Service
-- 4. Supabase Realtime Publication untuk sinkronisasi multi-device
-- ====================================================================

-- 1. TAMBAH KOLOM PADA TABEL SERVICES
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Bridesmaid',
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. UPDATE CHECK CONSTRAINT STATUS BOOKINGS (MENAMBAHKAN 'menunggu_verifikasi')
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check CHECK (status IN (
    'menunggu_pembayaran',
    'menunggu_verifikasi',
    'menunggu_konfirmasi',
    'dikonfirmasi',
    'selesai',
    'batal',
    'kedaluwarsa'
));

-- 3. TAMBAH KOLOM BUKTI TRANSFER & LOKASI GPS PADA BOOKINGS
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
ADD COLUMN IF NOT EXISTS payment_receipt_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_bank_name TEXT,
ADD COLUMN IF NOT EXISTS payment_sender_name TEXT,
ADD COLUMN IF NOT EXISTS location_map_url TEXT,
ADD COLUMN IF NOT EXISTS gps_latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS gps_longitude NUMERIC(10, 7);

-- 4. AKTIFKAN SUPABASE REALTIME PADA TABEL BOOKINGS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 5. RLS POLICIES UNTUK PUBLIC & ADMIN
DROP POLICY IF EXISTS "Public insert bookings" ON public.bookings;
CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update receipt on bookings" ON public.bookings;
CREATE POLICY "Public update receipt on bookings" ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public select bookings" ON public.bookings;
CREATE POLICY "Public select bookings" ON public.bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public upsert clients" ON public.clients;
CREATE POLICY "Public upsert clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

-- 6. RLS POLICIES UNTUK SETTINGS & SERVICES (SINKRONISASI MULTI-DEVICE LENGKAP)
DROP POLICY IF EXISTS "Public read public settings" ON public.settings;
CREATE POLICY "Public read public settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public upsert settings" ON public.settings;
CREATE POLICY "Public upsert settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read services" ON public.services;
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public upsert services" ON public.services;
CREATE POLICY "Public upsert services" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- 7. SEED SUB-PAKET LENGKAP & FOTO KE TABEL SERVICES
INSERT INTO public.services (id, name, category, description, price, duration_minutes, image_url, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Bridesmaid Standard Glam', 'Bridesmaid', 'Makeup natural flawless glam untuk pendamping pengantin (termasuk hijab do / hair do standar & free pasang bulu mata).', 450000, 75, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80', true),
    ('11111111-1111-1111-1111-111111111112', 'Bridesmaid Premium Hijab Do', 'Bridesmaid', 'Flawless glowing look tahan seharian dengan styling hijab anggun, jarum & aksesoris mutiara premium.', 500000, 80, 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80', true),
    ('11111111-1111-1111-1111-111111111113', 'Bridesmaid Modern Hairdo Waves', 'Bridesmaid', 'Complexion tahan lama tanpa cakey dipadu hair styling korean waves / half updo elegan.', 550000, 90, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', true),
    ('11111111-1111-1111-1111-111111111114', 'Bridesmaid Paket Rombongan (Min. 3 Pax)', 'Bridesmaid', 'Tarif spesial hemat untuk rombongan keluarga atau bridesmaid minimal 3 orang (harga per orang).', 400000, 60, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80', true),
    ('22222222-2222-2222-2222-222222222222', 'Wedding Akad Natural Flawless', 'Wedding', 'Rias pengantin akad premium tahan hingga 12 jam, complexion waterproof, softlens & exclusive touch-up kit.', 2000000, 150, 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80', true),
    ('22222222-2222-2222-2222-222222222223', 'Wedding Resepsi Luxury Glam', 'Wedding', 'Bold glam look mewah untuk resepsi malam hari, bulu mata 3 lapis bertingkat, body shimmer & hair/hijab tiara styling.', 2750000, 180, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80', true),
    ('22222222-2222-2222-2222-222222222224', 'Wedding Complete (Akad + Resepsi + Retouch)', 'Wedding', 'Paket rias komplit seharian: Makeup Akad pagi + ganti look resepsi malam + standby retouch oleh MUA Grisella.', 3800000, 240, 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80', true),
    ('22222222-2222-2222-2222-222222222225', 'Prewedding Makeup & Hairdo (2 Look)', 'Wedding', 'Makeup foto prewedding indoor / outdoor dengan 2 variasi look rias & ganti tatanan rambut / hijab.', 1200000, 120, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', true),
    ('33333333-3333-3333-3333-333333333333', 'Wisuda Fresh Glowing Look', 'Graduation', 'Fresh radiant glow tahan seharian tanpa cakey untuk momen wisuda berharga, free pasang bulu mata premium.', 400000, 60, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80', true),
    ('33333333-3333-3333-3333-333333333334', 'Wisuda Complete (+ Hijab / Hairdo)', 'Graduation', 'Paket rias wisuda lengkap dengan penataan hijab wisuda rapi kencang atau curly wavy hair tahan angin.', 475000, 75, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80', true),
    ('33333333-3333-3333-3333-333333333335', 'Wisuda & Mom Package (2 Orang)', 'Graduation', 'Paket spesial wisudawati + pendamping ibu tersayang, tampil kompak dan anggun di acara kelulusan.', 750000, 120, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', true),
    ('44444444-4444-4444-4444-444444444441', 'Photoshoot & Studio Commercial Look', 'Lainnya', 'Makeup high-definition khusus studio lighting, shooting video komersial atau katalog brand.', 600000, 90, 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80', true),
    ('44444444-4444-4444-4444-444444444442', 'Party / Prom Night / Gala Event', 'Lainnya', 'Look glam elegan untuk pesta ulang tahun, prom night, atau menghadiri gala dinner formal.', 450000, 75, 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80', true),
    ('44444444-4444-4444-4444-444444444443', 'Engagement / Lamaran / Sangjit Look', 'Lainnya', 'Look memukau untuk prosesi lamaran & tunangan resmi (termasuk styling hijab/rambut & bulu mata).', 1000000, 120, 'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?auto=format&fit=crop&w=600&q=80', true),
    ('44444444-4444-4444-4444-444444444444', 'Lainnya (Custom Request Khusus)', 'Lainnya', 'Request makeup khusus (Photoshoot, Panggung, Teater, Karakter). Durasi & tarif dikonfirmasi oleh Admin.', 0, 90, 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=600&q=80', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_minutes = EXCLUDED.duration_minutes,
    image_url = EXCLUDED.image_url,
    is_active = EXCLUDED.is_active;

-- 8. UPDATE SETTINGS UTAMA (NO WA & ALAMAT RESMI GRISELLA)
INSERT INTO public.settings (key, value, description)
VALUES 
    ('mua_whatsapp', '6285156847921', 'Nomor WhatsApp MUA aktif untuk konfirmasi & bantuan'),
    ('studio_address', 'jl gunur no 368', 'Alamat resmi studio Grisella Makeup')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value;

