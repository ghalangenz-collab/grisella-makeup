import { Service, WorkingHour, Client } from '@/types/database';

export const INITIAL_SERVICES: Service[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Bridesmaid Makeup',
    description: 'Makeup natural flawless glam untuk pendamping pengantin (termasuk hijab do / hair do standar).',
    price: 450000,
    duration_minutes: 75,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Wedding Makeup (Akad / Resepsi)',
    description: 'Rias pengantin premium tahan hingga 12 jam, complexion waterproof & retouch touch-up kit eksklusif.',
    price: 2500000,
    duration_minutes: 180,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Graduation / Wisuda Makeup',
    description: 'Fresh glowing look tahan seharian untuk momen wisuda, free pasang bulu mata premium.',
    price: 400000,
    duration_minutes: 60,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Lainnya (Custom Request)',
    description: 'Request makeup khusus (Photoshoot, Party, Sangjit, Panggung, dll). Durasi & harga dikonfirmasi oleh Admin.',
    price: 0,
    duration_minutes: 90,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

export const INITIAL_SETTINGS: Record<string, string> = {
  dp_percentage: '30',
  buffer_studio_minutes: '30',
  buffer_home_minutes: '60',
  min_hours_same_day: '3',
  studio_address: 'Jl. Melati Indah No. 18, Kebayoran Baru, Jakarta Selatan',
  mua_whatsapp: '6281234567890',
  cancellation_policy: 'DP (Down Payment) yang telah dibayarkan bersifat non-refundable (tidak dapat dikembalikan) jika pemesanan dibatalkan secara sepihak oleh klien.',
  transport_fee_zones: JSON.stringify([
    { zone: 'Jakarta Selatan & sekitarnya (<5 km)', fee: 50000 },
    { zone: 'Jakarta Pusat / Barat / Timur (5-15 km)', fee: 100000 },
    { zone: 'Tangerang / Depok / Bekasi / Luar Kota (>15 km)', fee: 175000 },
  ]),
  qris_image_url: '/images/qris-grisella.svg',
  qris_merchant_name: 'GRISELLA MAKEUP',
  qris_nmid: 'ID102034091283',
  bank_accounts: JSON.stringify([
    {
      id: 'bca-1',
      bank_name: 'BCA',
      account_number: '8735091234',
      account_name: 'GRISELLA PUTRI',
    },
    {
      id: 'mandiri-1',
      bank_name: 'Bank Mandiri',
      account_number: '1370019283741',
      account_name: 'GRISELLA PUTRI',
    },
    {
      id: 'bri-1',
      bank_name: 'Bank BRI',
      account_number: '034101002345501',
      account_name: 'GRISELLA PUTRI',
    },
  ]),
};

export const INITIAL_WORKING_HOURS: WorkingHour[] = [
  { id: 'wh-0', day_of_week: 0, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-1', day_of_week: 1, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-2', day_of_week: 2, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-3', day_of_week: 3, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-4', day_of_week: 4, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-5', day_of_week: 5, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-6', day_of_week: 6, start_time: '08:00', end_time: '20:00', is_active: true },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Alya Putri Maharani',
    phone: '081298765432',
    phone_normalized: '+6281298765432',
    skin_type: 'Kombinasi',
    allergies: 'Minyak kelapa',
    birthday: '1998-05-14',
    notes_shade: 'Warm Beige 02',
    notes_lipstick: 'Peachy Nude',
    notes_favorite_style: 'Soft Glam',
    source: 'Instagram',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'c2',
    name: 'Clarissa Devina',
    phone: '081311223344',
    phone_normalized: '+6281311223344',
    skin_type: 'Kering',
    allergies: 'Tidak ada',
    birthday: '2001-09-22',
    notes_shade: 'Ivory Fair',
    notes_lipstick: 'Rosy Pink Velvet',
    notes_favorite_style: 'Korean Dewy',
    source: 'TikTok',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

export const DEFAULT_SERVICES = INITIAL_SERVICES;
export const DEFAULT_SETTINGS = INITIAL_SETTINGS;
export const DEFAULT_WORKING_HOURS = INITIAL_WORKING_HOURS;
