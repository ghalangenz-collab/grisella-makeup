-- ====================================================================
-- GRISELLA MAKEUP - INITIAL DATABASE MIGRATION (FIXED & IDEMPOTENT)
-- Database: PostgreSQL (Supabase, Region Singapore)
-- Timezone: Asia/Jakarta (WIB)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. IMMUTABLE RANGE FUNCTION UNTUK GIST EXCLUSION CONSTRAINT
-- Diperlukan karena fungsi bawaan tstzrange() pada PostgreSQL bersifat STABLE (bukan IMMUTABLE)
CREATE OR REPLACE FUNCTION public.immutable_tstzrange(start_t TIMESTAMPTZ, end_t TIMESTAMPTZ)
RETURNS TSTZRANGE AS $$
BEGIN
    RETURN tstzrange(start_t, end_t, '[)');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Normalisasi nomor WhatsApp ke standar E.164 (+62...)
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

-- Trigger auto updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABEL: SERVICES
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 90,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS handle_services_updated_at ON public.services;
CREATE TRIGGER handle_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 4. TABEL: CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    phone_normalized TEXT NOT NULL UNIQUE,
    skin_type TEXT,
    allergies TEXT,
    birthday DATE,
    notes_shade TEXT,
    notes_lipstick TEXT,
    notes_favorite_style TEXT,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS handle_clients_updated_at ON public.clients;
CREATE TRIGGER handle_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_clients_phone_normalized ON public.clients(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

-- 5. TABEL: BOOKINGS (Pencegahan Double Booking Menggunakan immutable_tstzrange)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_token TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    makeup_type TEXT NOT NULL,
    custom_request TEXT,
    service_location TEXT NOT NULL CHECK (service_location IN ('studio', 'home')),
    address TEXT,
    address_benchmark TEXT,
    notes TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'menunggu_pembayaran' CHECK (status IN (
        'menunggu_pembayaran',
        'menunggu_konfirmasi',
        'dikonfirmasi',
        'selesai',
        'batal',
        'kedaluwarsa'
    )),
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transport_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    dp_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_dp_at TIMESTAMPTZ,
    paid_settlement_at TIMESTAMPTZ,
    settlement_amount NUMERIC(12, 2) DEFAULT 0,
    settlement_method TEXT CHECK (settlement_method IN ('tunai', 'transfer', NULL)),
    source TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT valid_booking_time_range CHECK (end_at > start_at)
);

-- Tambahkan exclusion constraint aman
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'exclude_overlapping_active_slots'
    ) THEN
        ALTER TABLE public.bookings
        ADD CONSTRAINT exclude_overlapping_active_slots 
        EXCLUDE USING gist (
            public.immutable_tstzrange(start_at, end_at) WITH &&
        ) WHERE (status IN ('menunggu_pembayaran', 'dikonfirmasi', 'selesai'));
    END IF;
END $$;

DROP TRIGGER IF EXISTS handle_bookings_updated_at ON public.bookings;
CREATE TRIGGER handle_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_bookings_public_token ON public.bookings(public_token);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_at ON public.bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 6. TABEL: PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    transaction_id TEXT,
    gross_amount NUMERIC(12, 2) NOT NULL,
    payment_type TEXT,
    transaction_status TEXT NOT NULL,
    fraud_status TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS handle_payments_updated_at ON public.payments;
CREATE TRIGGER handle_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);

-- 7. TABEL: WORKING_HOURS
CREATE TABLE IF NOT EXISTS public.working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT unique_day_of_week UNIQUE (day_of_week)
);

-- 8. TABEL: BLOCKED_SLOTS
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_blocked_range CHECK (end_at > start_at)
);

-- 9. TABEL: SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS handle_settings_updated_at ON public.settings;
CREATE TRIGGER handle_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 10. TABEL: MESSAGE_TEMPLATES
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    body_template TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. VIEW CRM: v_client_loyalty
DROP VIEW IF EXISTS public.v_client_loyalty CASCADE;
CREATE OR REPLACE VIEW public.v_client_loyalty AS
WITH completed_orders AS (
    SELECT 
        b.client_id,
        COUNT(*)::INTEGER AS total_visits,
        COALESCE(SUM(b.total_price), 0)::NUMERIC(12,2) AS total_spend,
        COALESCE(AVG(b.total_price), 0)::NUMERIC(12,2) AS avg_spend,
        MAX(b.start_at) AS last_makeup_at
    FROM public.bookings b
    WHERE b.status = 'selesai'
    GROUP BY b.client_id
),
fav_service AS (
    SELECT DISTINCT ON (b.client_id)
        b.client_id,
        b.makeup_type AS favorite_service
    FROM public.bookings b
    WHERE b.status = 'selesai'
    GROUP BY b.client_id, b.makeup_type
    ORDER BY b.client_id, COUNT(*) DESC
)
SELECT 
    c.id AS client_id,
    c.name,
    c.phone,
    c.phone_normalized,
    c.skin_type,
    c.allergies,
    c.birthday,
    c.notes_shade,
    c.notes_lipstick,
    c.notes_favorite_style,
    c.source,
    c.created_at,
    COALESCE(co.total_visits, 0) AS total_visits,
    COALESCE(co.total_spend, 0) AS total_spend,
    COALESCE(co.avg_spend, 0) AS avg_spend,
    co.last_makeup_at,
    fs.favorite_service,
    CASE
        WHEN COALESCE(co.total_visits, 0) >= 5 OR COALESCE(co.total_spend, 0) >= 2500000 THEN 'VIP'
        WHEN COALESCE(co.total_visits, 0) >= 1 AND co.last_makeup_at < (timezone('utc'::text, now()) - make_interval(days => 90)) THEN 'Hampir Hilang'
        WHEN COALESCE(co.total_visits, 0) >= 3 THEN 'Langganan'
        WHEN COALESCE(co.total_visits, 0) >= 1 THEN 'Baru'
        ELSE 'Prospek Baru'
    END AS loyalty_badge
FROM public.clients c
LEFT JOIN completed_orders co ON c.id = co.client_id
LEFT JOIN fav_service fs ON c.id = fs.client_id;

-- 12. FUNGSI CRM: MERGE CLIENTS
CREATE OR REPLACE FUNCTION public.merge_clients(target_id UUID, source_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    src RECORD;
BEGIN
    IF target_id = source_id THEN
        RAISE EXCEPTION 'Target dan source client tidak boleh sama';
    END IF;

    SELECT * INTO src FROM public.clients WHERE id = source_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source client tidak ditemukan';
    END IF;

    UPDATE public.bookings 
    SET client_id = target_id, updated_at = timezone('utc'::text, now())
    WHERE client_id = source_id;

    UPDATE public.clients
    SET 
        skin_type = COALESCE(skin_type, src.skin_type),
        allergies = COALESCE(allergies, src.allergies),
        birthday = COALESCE(birthday, src.birthday),
        notes_shade = COALESCE(notes_shade, src.notes_shade),
        notes_lipstick = COALESCE(notes_lipstick, src.notes_lipstick),
        notes_favorite_style = COALESCE(notes_favorite_style, src.notes_favorite_style),
        source = COALESCE(source, src.source),
        updated_at = timezone('utc'::text, now())
    WHERE id = target_id;

    DELETE FROM public.clients WHERE id = source_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid collision
DROP POLICY IF EXISTS "Public read active services" ON public.services;
DROP POLICY IF EXISTS "Admin full access services" ON public.services;
DROP POLICY IF EXISTS "Public read public settings" ON public.settings;
DROP POLICY IF EXISTS "Admin full access settings" ON public.settings;
DROP POLICY IF EXISTS "Public read working hours" ON public.working_hours;
DROP POLICY IF EXISTS "Admin full access working hours" ON public.working_hours;
DROP POLICY IF EXISTS "Public read blocked slots" ON public.blocked_slots;
DROP POLICY IF EXISTS "Admin full access blocked slots" ON public.blocked_slots;
DROP POLICY IF EXISTS "Admin full access bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin full access clients" ON public.clients;
DROP POLICY IF EXISTS "Admin full access payments" ON public.payments;
DROP POLICY IF EXISTS "Admin full access message templates" ON public.message_templates;

CREATE POLICY "Public read active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read public settings" ON public.settings FOR SELECT USING (
    key IN (
        'dp_percentage', 
        'buffer_studio_minutes', 
        'buffer_home_minutes', 
        'min_hours_same_day', 
        'studio_address', 
        'mua_whatsapp', 
        'cancellation_policy',
        'transport_fee_zones'
    )
);
CREATE POLICY "Admin full access settings" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read working hours" ON public.working_hours FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access working hours" ON public.working_hours FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read blocked slots" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "Admin full access blocked slots" ON public.blocked_slots FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access bookings" ON public.bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access message templates" ON public.message_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
