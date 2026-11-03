-- ====================================================================
-- GRISELLA MAKEUP - MASTER ALL-IN-ONE SETUP SCRIPT (100% IDEMPOTENT)
-- Jalankan script ini di Supabase SQL Editor untuk mengaktifkan
-- database sinkronisasi multi-device (Laptop, HP Admin, HP Klien)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNGSI IMMUTABLE & HELPER
CREATE OR REPLACE FUNCTION public.immutable_tstzrange(start_t TIMESTAMPTZ, end_t TIMESTAMPTZ)
RETURNS TSTZRANGE AS $$
BEGIN
    RETURN tstzrange(start_t, end_t, '[)');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.normalize_phone_id(input_phone TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned TEXT;
BEGIN
    IF input_phone IS NULL THEN
        RETURN NULL;
    END IF;
    cleaned := regexp_replace(input_phone, '[^\d+]', '', 'g');
    
    IF cleaned ~ '^0[0-9]+' THEN
        cleaned := '+62' || substring(cleaned from 2);
    ELSIF cleaned ~ '^62[0-9]+' THEN
        cleaned := '+' || cleaned;
    ELSIF NOT (cleaned ~ '^\+62') AND cleaned ~ '^[0-9]+' THEN
        cleaned := '+62' || cleaned;
    END IF;

    RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABEL: SERVICES (Daftar Layanan, Kategori & Foto)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Bridesmaid',
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 90,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Bridesmaid';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;

DROP TRIGGER IF EXISTS handle_services_updated_at ON public.services;
CREATE TRIGGER handle_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 4. TABEL: CLIENTS (Database Pelanggan)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    phone_normalized TEXT NOT NULL,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    source TEXT DEFAULT 'Instagram',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clients_phone_normalized ON public.clients(phone_normalized);

DROP TRIGGER IF EXISTS handle_clients_updated_at ON public.clients;
CREATE TRIGGER handle_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5. TABEL: BOOKINGS (Reservasi, DP, GPS & Struk Transfer)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_token TEXT UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    makeup_type TEXT NOT NULL,
    custom_request TEXT,
    service_location TEXT NOT NULL CHECK (service_location IN ('studio', 'home')),
    address TEXT NOT NULL,
    address_benchmark TEXT,
    location_map_url TEXT,
    gps_latitude NUMERIC(10, 7),
    gps_longitude NUMERIC(10, 7),
    notes TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'menunggu_pembayaran',
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transport_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    dp_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_dp_at TIMESTAMPTZ,
    paid_settlement_at TIMESTAMPTZ,
    settlement_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    settlement_method TEXT,
    payment_receipt_url TEXT,
    payment_receipt_uploaded_at TIMESTAMPTZ,
    payment_bank_name TEXT,
    payment_sender_name TEXT,
    source TEXT DEFAULT 'Web App',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_bookings_time_order CHECK (end_at > start_at)
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_map_url TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gps_latitude NUMERIC(10, 7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gps_longitude NUMERIC(10, 7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_receipt_uploaded_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_bank_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_sender_name TEXT;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN (
    'menunggu_pembayaran',
    'menunggu_verifikasi',
    'menunggu_konfirmasi',
    'dikonfirmasi',
    'selesai',
    'batal',
    'kedaluwarsa'
));

CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON public.bookings(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_bookings_token ON public.bookings(public_token);

DROP TRIGGER IF EXISTS handle_bookings_updated_at ON public.bookings;
CREATE TRIGGER handle_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 6. TABEL: SETTINGS (Pengaturan Sistem & Kontak MUA)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS handle_settings_updated_at ON public.settings;
CREATE TRIGGER handle_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 7. TABEL: WORKING HOURS & BLOCKED SLOTS
CREATE TABLE IF NOT EXISTS public.working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL DEFAULT '08:00:00',
    end_time TIME NOT NULL DEFAULT '20:00:00',
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT unique_day_of_week UNIQUE (day_of_week)
);

ALTER TABLE public.working_hours ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT '08:00:00';
ALTER TABLE public.working_hours ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT '20:00:00';

CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Slot Diblokir',
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_blocked_time_order CHECK (end_at > start_at)
);

-- 8. AKTIFKAN SUPABASE REALTIME (AGAR NOTIFIKASI MULTI-DEVICE BERBUNYI INSTAN)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 9. KEBIJAKAN AKSES (ROW LEVEL SECURITY) - IZINKAN CLIENT & ADMIN
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access services" ON public.services;
CREATE POLICY "Public access services" ON public.services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access clients" ON public.clients;
CREATE POLICY "Public access clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access bookings" ON public.bookings;
CREATE POLICY "Public access bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access settings" ON public.settings;
CREATE POLICY "Public access settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access working_hours" ON public.working_hours;
CREATE POLICY "Public access working_hours" ON public.working_hours FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access blocked_slots" ON public.blocked_slots;
CREATE POLICY "Public access blocked_slots" ON public.blocked_slots FOR ALL USING (true) WITH CHECK (true);

-- 10. ISI DATA AWAL (SEED) SERVICES LENGKAP DENGAN KATEGORI & FOTO
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

-- 11. ISI PENGATURAN AWAL SISTEM (SETTING)
INSERT INTO public.settings (key, value)
VALUES
    ('dp_percentage', '30'),
    ('buffer_studio_minutes', '30'),
    ('buffer_home_minutes', '60'),
    ('min_hours_same_day', '3'),
    ('studio_address', 'jl gunur no 368'),
    ('mua_whatsapp', '6285156847921'),
    ('cancellation_policy', 'DP (Down Payment) yang telah dibayarkan bersifat non-refundable (tidak dapat dikembalikan) jika pemesanan dibatalkan secara sepihak oleh klien.'),
    ('transport_fee_zones', '[{"zone":"Jakarta Selatan & sekitarnya (<5 km)","fee":50000},{"zone":"Jakarta Pusat / Barat / Timur (5-15 km)","fee":100000},{"zone":"Tangerang / Depok / Bekasi / Luar Kota (>15 km)","fee":175000}]'),
    ('qris_image_url', '/images/qris-grisella.svg'),
    ('qris_merchant_name', 'GRISELLA MAKEUP'),
    ('qris_nmid', 'ID102034091283'),
    ('bank_accounts', '[{"id":"bca-1","bank_name":"BCA","account_number":"461089199","account_name":"GRISELLA CARELA"},{"id":"mandiri-1","bank_name":"Bank Mandiri","account_number":"1370019283741","account_name":"GRISELLA CARELA"},{"id":"bri-1","bank_name":"Bank BRI","account_number":"034101002345501","account_name":"GRISELLA CARELA"}]')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value;

-- 12. JAM KERJA DEFAULT (0=Minggu, 1=Senin, ..., 6=Sabtu)
INSERT INTO public.working_hours (day_of_week, is_active, start_time, end_time)
VALUES
    (0, true, '08:00:00', '20:00:00'),
    (1, true, '08:00:00', '20:00:00'),
    (2, true, '08:00:00', '20:00:00'),
    (3, true, '08:00:00', '20:00:00'),
    (4, true, '08:00:00', '20:00:00'),
    (5, true, '08:00:00', '20:00:00'),
    (6, true, '08:00:00', '20:00:00')
ON CONFLICT (day_of_week) DO NOTHING;
