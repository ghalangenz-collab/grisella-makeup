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
