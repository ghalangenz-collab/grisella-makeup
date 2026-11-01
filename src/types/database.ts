// ====================================================================
// GRISELLA MAKEUP - DATABASE & APPLICATION TYPES
// ====================================================================

export type BookingStatus =
  | 'menunggu_pembayaran'
  | 'menunggu_verifikasi'
  | 'menunggu_konfirmasi'
  | 'dikonfirmasi'
  | 'selesai'
  | 'batal'
  | 'kedaluwarsa';

export type ServiceLocation = 'studio' | 'home';

export type MakeupCategory =
  | 'Bridesmaid'
  | 'Wedding'
  | 'Graduation'
  | 'Lainnya';

export type ClientSource =
  | 'Instagram'
  | 'TikTok'
  | 'Teman/Keluarga'
  | 'Lainnya';

export type LoyaltyBadge =
  | 'Baru'
  | 'Langganan'
  | 'VIP'
  | 'Hampir Hilang'
  | 'Prospek Baru';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  phone_normalized: string;
  skin_type: string | null;
  allergies: string | null;
  birthday: string | null;
  notes_shade: string | null;
  notes_lipstick: string | null;
  notes_favorite_style: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface Booking {
  id: string;
  public_token: string;
  client_id: string;
  service_id: string | null;
  makeup_type: MakeupCategory | string;
  custom_request: string | null;
  service_location: ServiceLocation;
  address: string | null;
  address_benchmark: string | null;
  notes: string | null;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  total_price: number;
  transport_fee: number;
  dp_amount: number;
  paid_dp_at: string | null;
  paid_settlement_at: string | null;
  settlement_amount: number;
  settlement_method: 'tunai' | 'transfer' | null;
  payment_receipt_url?: string | null;
  payment_receipt_uploaded_at?: string | null;
  payment_bank_name?: string | null;
  payment_sender_name?: string | null;
  source: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  client?: Client;
  service?: Service;
}

export interface Payment {
  id: string;
  booking_id: string;
  order_id: string;
  transaction_id: string | null;
  gross_amount: number;
  payment_type: string | null;
  transaction_status: string;
  fraud_status: string | null;
  raw_response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface WorkingHour {
  id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BlockedSlot {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  code: string;
  title: string;
  body_template: string;
  updated_at: string;
}

export interface ClientLoyaltyView {
  client_id: string;
  name: string;
  phone: string;
  phone_normalized: string;
  skin_type: string | null;
  allergies: string | null;
  birthday: string | null;
  notes_shade: string | null;
  notes_lipstick: string | null;
  notes_favorite_style: string | null;
  source: string | null;
  created_at: string;
  total_visits: number;
  total_spend: number;
  avg_spend: number;
  last_makeup_at: string | null;
  favorite_service: string | null;
  loyalty_badge: LoyaltyBadge;
}

export interface TransportZone {
  zone: string;
  fee: number;
}
