import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke mata uang Rupiah Indonesia (cth: Rp 450.000)
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (numeric === null || numeric === undefined || isNaN(numeric)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

/**
 * Normalisasi nomor telepon ke standar Indonesia (+62...)
 * Menangani format 0812..., 62812..., +62812..., spasi, dan tanda hubung
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '+62' + cleaned.substring(1);
  } else if (cleaned.startsWith('62')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+62')) {
    cleaned = '+62' + cleaned;
  }

  return cleaned;
}

/**
 * Normalisasi nomor WhatsApp untuk URL wa.me (hanya digit, tanpa tanda +, dengan awalan 62)
 * Menangani 0812..., +62812..., 62812..., format berjarak, strip, dll.
 */
export function normalizeWhatsAppNumber(rawPhone: string | undefined | null): string {
  if (!rawPhone) return '6285156847921';
  let cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned || '6285156847921';
}

/**
 * Membuat link Google Maps untuk navigasi atau pin lokasi
 */
export function createGoogleMapsUrl(
  lat?: number | null,
  lng?: number | null,
  address?: string | null
): string {
  if (lat && lng) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return 'https://maps.google.com';
}

/**
 * Memainkan suara notifikasi chime elegan menggunakan Web Audio API
 * Berjalan langsung di browser tanpa perlu mengunduh file mp3/wav eksternal
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Nada pertama (880 Hz / A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Nada kedua (1318.5 Hz / E6) - nada lonceng manis
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);
    gain2.gain.setValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Abaikan jika autoplay audio belum diizinkan oleh user
  }
}

/**
 * Format tanggal dalam zona waktu Asia/Jakarta (WIB) dengan locale Indonesia
 */
export function formatWIBDate(
  dateInput: string | Date,
  formatPattern: string = 'dd MMMM yyyy'
): string {
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return format(date, formatPattern, { locale: id });
  } catch {
    return String(dateInput);
  }
}

/**
 * Format jam dalam WIB (cth: 09:30 WIB)
 */
export function formatWIBTime(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return `${format(date, 'HH:mm')} WIB`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Generate token publik acak yang aman untuk URL booking (/booking/[token])
 */
export function generateBookingToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'grs_';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Memastikan URL bukti transfer dan link GPS terisi secara konsisten
 * Mendukung pembacaan dari properti kolom maupun fallback di dalam notes
 */
export function enrichBookingGpsAndReceipt<T extends Record<string, any>>(b: T): T {
  if (!b) return b;
  let payment_receipt_url = b.payment_receipt_url || null;
  let payment_bank_name = b.payment_bank_name || null;
  let payment_sender_name = b.payment_sender_name || null;

  if (!payment_receipt_url && b.notes && typeof b.notes === 'string' && b.notes.includes('[BUKTI DP:')) {
    const match = b.notes.match(/\[BUKTI DP:\s*([^|\]]+)(?:\|\s*([^|\]]+))?(?:\|\s*([^|\]]+))?\]/);
    if (match) {
      payment_receipt_url = match[1]?.trim() || null;
      if (match[2]) payment_bank_name = match[2]?.trim();
      if (match[3]) payment_sender_name = match[3]?.trim();
    }
  }

  let location_map_url = b.location_map_url || null;
  if (!location_map_url && b.address_benchmark && typeof b.address_benchmark === 'string') {
    const matchGps = b.address_benchmark.match(/(https?:\/\/[^\s|]+(?:google\.com\/maps|maps\.app\.goo\.gl)[^\s|]*)/);
    if (matchGps) {
      location_map_url = matchGps[1];
    }
  }

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
