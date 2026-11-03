import fs from 'fs';
import path from 'path';
import { Service, Booking, Client, WorkingHour, BlockedSlot, BankAccount } from '@/types/database';

const DATA_DIR = path.join(process.cwd(), 'data');

const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');

// In-memory cache fallback for serverless environments (e.g. Vercel)
declare global {
  var __grisella_storageCache: Record<string, any> | undefined;
}
globalThis.__grisella_storageCache = globalThis.__grisella_storageCache || {};
const memoryCache: Record<string, any> = globalThis.__grisella_storageCache;

// Ensure data folder exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem in serverless environments (e.g. Vercel)
  }
}

export {
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_WORKING_HOURS,
  INITIAL_CLIENTS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
  DEFAULT_WORKING_HOURS,
} from './constants';
import {
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_WORKING_HOURS,
  INITIAL_CLIENTS,
} from './constants';

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    public_token: 'grs_alya2026',
    client_id: 'c1',
    service_id: '11111111-1111-1111-1111-111111111111',
    makeup_type: 'Bridesmaid Makeup',
    custom_request: null,
    service_location: 'studio',
    address: 'Jl. Melati Indah No. 18, Kebayoran Baru, Jakarta Selatan',
    address_benchmark: null,
    notes: 'Kulit sensitif, suka lipstick warna peach.',
    start_at: new Date(Date.now() + 4 * 3600000).toISOString(),
    end_at: new Date(Date.now() + 4 * 3600000 + 75 * 60000).toISOString(),
    status: 'dikonfirmasi',
    total_price: 450000,
    transport_fee: 0,
    dp_amount: 135000,
    paid_dp_at: new Date().toISOString(),
    paid_settlement_at: null,
    settlement_amount: 0,
    settlement_method: null,
    payment_receipt_url: null,
    source: 'Instagram',
    expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: INITIAL_CLIENTS[0],
    service: INITIAL_SERVICES[0],
  },
  {
    id: 'b2',
    public_token: 'grs_clarissa_cust',
    client_id: 'c2',
    service_id: null,
    makeup_type: 'Lainnya',
    custom_request: 'Photoshoot tema fairytale garden, butuh 2 touchup look berbeda.',
    service_location: 'home',
    address: 'Apartemen Senopati Suites Tower 2 Unit 15A',
    address_benchmark: 'Depan lobby utara',
    notes: 'Acara mulai jam 2 siang.',
    start_at: new Date(Date.now() + 86400000).toISOString(),
    end_at: new Date(Date.now() + 86400000 + 120 * 60000).toISOString(),
    status: 'menunggu_konfirmasi',
    total_price: 0,
    transport_fee: 50000,
    dp_amount: 0,
    paid_dp_at: null,
    paid_settlement_at: null,
    settlement_amount: 0,
    settlement_method: null,
    payment_receipt_url: null,
    source: 'TikTok',
    expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: INITIAL_CLIENTS[1],
  },
];

// Helper to read JSON safely
function readJsonFile<T>(filePath: string, fallback: T): T {
  if (memoryCache[filePath]) {
    return memoryCache[filePath] as T;
  }
  ensureDataDir();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as T;
      memoryCache[filePath] = parsed;
      return parsed;
    }
  } catch (error) {
    console.warn(`Fallback reading ${filePath}:`, error);
  }
  memoryCache[filePath] = fallback;
  return fallback;
}

// Helper to write JSON safely
function writeJsonFile<T>(filePath: string, data: T): void {
  memoryCache[filePath] = data;
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    // Serverless (Vercel) lambda has read-only filesystem, memoryCache holds state
    console.warn(`Notice: writing on read-only filesystem (${filePath}). Kept in memoryCache.`);
  }
}

// ====================================================================
// SERVICES STORAGE
// ====================================================================

export function getStoredServices(): Service[] {
  const list = readJsonFile<Service[]>(SERVICES_FILE, INITIAL_SERVICES);
  if (!list || list.length <= 4 || !list[0]?.category) {
    saveStoredServices(INITIAL_SERVICES);
    return INITIAL_SERVICES;
  }
  return list;
}

export function saveStoredServices(services: Service[]): void {
  writeJsonFile(SERVICES_FILE, services);
}

export function getStoredServiceById(id: string): Service | undefined {
  const services = getStoredServices();
  return services.find((s) => s.id === id);
}

export function upsertStoredService(service: Partial<Service> & { id?: string }): Service {
  const services = getStoredServices();
  const id = service.id || crypto.randomUUID();
  const existingIndex = services.findIndex((s) => s.id === id);
  const existing = existingIndex >= 0 ? services[existingIndex] : null;

  const updated: Service = {
    id,
    name: service.name !== undefined ? service.name : (existing ? existing.name : 'Layanan Baru'),
    category: service.category !== undefined ? service.category : (existing ? existing.category : 'Bridesmaid'),
    description: service.description !== undefined ? service.description : (existing ? existing.description : ''),
    price: service.price !== undefined ? (Number(service.price) || 0) : (existing ? existing.price : 0),
    duration_minutes: service.duration_minutes !== undefined ? (Number(service.duration_minutes) || 60) : (existing ? existing.duration_minutes : 60),
    image_url: service.image_url !== undefined ? service.image_url : (existing ? existing.image_url : null),
    is_active: service.is_active !== undefined ? Boolean(service.is_active) : (existing ? existing.is_active : true),
    created_at: existing ? existing.created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    services[existingIndex] = updated;
  } else {
    services.push(updated);
  }

  saveStoredServices(services);
  return updated;
}

export function deleteStoredService(id: string): boolean {
  const services = getStoredServices();
  const filtered = services.filter((s) => s.id !== id);
  if (filtered.length !== services.length) {
    saveStoredServices(filtered);
    return true;
  }
  return false;
}

// ====================================================================
// SETTINGS STORAGE
// ====================================================================

export function getStoredSettings(): Record<string, string> {
  const saved = readJsonFile<Record<string, string>>(SETTINGS_FILE, INITIAL_SETTINGS);
  return { ...INITIAL_SETTINGS, ...saved };
}

export function saveStoredSettings(newSettings: Record<string, string>): Record<string, string> {
  const current = getStoredSettings();
  const merged = { ...current, ...newSettings };
  writeJsonFile(SETTINGS_FILE, merged);
  return merged;
}

// ====================================================================
// SCHEDULE STORAGE (WORKING HOURS & BLOCKED SLOTS)
// ====================================================================

interface ScheduleData {
  workingHours: WorkingHour[];
  blockedSlots: BlockedSlot[];
}

export function getStoredSchedule(): ScheduleData {
  return readJsonFile<ScheduleData>(SCHEDULE_FILE, {
    workingHours: INITIAL_WORKING_HOURS,
    blockedSlots: [],
  });
}

export function saveStoredSchedule(data: ScheduleData): void {
  writeJsonFile(SCHEDULE_FILE, data);
}

export function updateStoredWorkingHour(
  dayOfWeek: number,
  changes: Partial<WorkingHour>
): WorkingHour {
  const schedule = getStoredSchedule();
  const dayNum = Number(dayOfWeek);
  let wh = schedule.workingHours.find((w) => w.day_of_week === dayNum);

  if (wh) {
    Object.assign(wh, changes);
  } else {
    wh = {
      id: `wh-${dayNum}`,
      day_of_week: dayNum,
      start_time: changes.start_time || '08:00',
      end_time: changes.end_time || '20:00',
      is_active: changes.is_active !== undefined ? changes.is_active : true,
    };
    schedule.workingHours.push(wh);
  }

  saveStoredSchedule(schedule);
  return wh;
}

export function addStoredBlockedSlot(slot: {
  start_at: string;
  end_at: string;
  reason?: string;
}): BlockedSlot {
  const schedule = getStoredSchedule();
  const newSlot: BlockedSlot = {
    id: `bs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    start_at: slot.start_at,
    end_at: slot.end_at,
    reason: slot.reason || null,
    created_at: new Date().toISOString(),
  };

  schedule.blockedSlots.push(newSlot);
  saveStoredSchedule(schedule);
  return newSlot;
}

export function deleteStoredBlockedSlot(id: string): boolean {
  const schedule = getStoredSchedule();
  const filtered = schedule.blockedSlots.filter((b) => b.id !== id);
  if (filtered.length !== schedule.blockedSlots.length) {
    schedule.blockedSlots = filtered;
    saveStoredSchedule(schedule);
    return true;
  }
  return false;
}

// ====================================================================
// CLIENTS STORAGE
// ====================================================================

export function getStoredClients(): Client[] {
  return readJsonFile<Client[]>(CLIENTS_FILE, INITIAL_CLIENTS);
}

export function saveStoredClients(clients: Client[]): void {
  writeJsonFile(CLIENTS_FILE, clients);
}

export function upsertStoredClient(clientData: Partial<Client> & { phone_normalized?: string; name: string }): Client {
  const clients = getStoredClients();
  const phoneNormalized = clientData.phone_normalized || clientData.phone?.replace(/\D/g, '') || '';
  
  let existing = clients.find(
    (c) => c.id === clientData.id || (phoneNormalized && c.phone_normalized === phoneNormalized)
  );

  if (existing) {
    Object.assign(existing, clientData, {
      updated_at: new Date().toISOString(),
    });
  } else {
    existing = {
      id: clientData.id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: clientData.name,
      phone: clientData.phone || '',
      phone_normalized: phoneNormalized,
      skin_type: clientData.skin_type || null,
      allergies: clientData.allergies || null,
      birthday: clientData.birthday || null,
      notes_shade: clientData.notes_shade || null,
      notes_lipstick: clientData.notes_lipstick || null,
      notes_favorite_style: clientData.notes_favorite_style || null,
      source: clientData.source || 'Lainnya',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    clients.push(existing);
  }

  saveStoredClients(clients);
  return existing;
}

export function deleteStoredClient(id: string): boolean {
  const clients = getStoredClients();
  const filtered = clients.filter((c) => c.id !== id);
  if (filtered.length !== clients.length) {
    saveStoredClients(filtered);
    return true;
  }
  return false;
}

export function mergeStoredClients(targetId: string, sourceId: string): boolean {
  const clients = getStoredClients();
  const bookings = getStoredBookings();

  const targetClient = clients.find((c) => c.id === targetId);
  const sourceIndex = clients.findIndex((c) => c.id === sourceId);

  if (!targetClient || sourceIndex < 0) return false;

  // Re-assign all bookings from sourceId to targetId
  bookings.forEach((b) => {
    if (b.client_id === sourceId) {
      b.client_id = targetId;
      b.client = targetClient;
      b.updated_at = new Date().toISOString();
    }
  });
  saveStoredBookings(bookings);

  // Remove source client
  clients.splice(sourceIndex, 1);
  saveStoredClients(clients);

  return true;
}

// ====================================================================
// BOOKINGS STORAGE
// ====================================================================

export function getStoredBookings(): Booking[] {
  return readJsonFile<Booking[]>(BOOKINGS_FILE, INITIAL_BOOKINGS);
}

export function saveStoredBookings(bookings: Booking[]): void {
  writeJsonFile(BOOKINGS_FILE, bookings);
}

export function getStoredBookingByToken(token: string): Booking | undefined {
  const bookings = getStoredBookings();
  const clients = getStoredClients();
  const services = getStoredServices();

  const found = bookings.find((b) => b.public_token === token);
  if (!found) return undefined;

  // Hydrate client & service if needed
  if (!found.client && found.client_id) {
    found.client = clients.find((c) => c.id === found.client_id);
  }
  if (!found.service && found.service_id) {
    found.service = services.find((s) => s.id === found.service_id);
  }

  return found;
}

export function getStoredBookingById(id: string): Booking | undefined {
  const bookings = getStoredBookings();
  const clients = getStoredClients();
  const services = getStoredServices();

  const found = bookings.find((b) => b.id === id);
  if (!found) return undefined;

  if (!found.client && found.client_id) {
    found.client = clients.find((c) => c.id === found.client_id);
  }
  if (!found.service && found.service_id) {
    found.service = services.find((s) => s.id === found.service_id);
  }

  return found;
}

export function upsertStoredBooking(booking: Booking): Booking {
  const bookings = getStoredBookings();
  const idx = bookings.findIndex((b) => b.id === booking.id || b.public_token === booking.public_token);

  if (idx >= 0) {
    bookings[idx] = {
      ...bookings[idx],
      ...booking,
      updated_at: new Date().toISOString(),
    };
  } else {
    bookings.push({
      ...booking,
      created_at: booking.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  saveStoredBookings(bookings);
  return idx >= 0 ? bookings[idx] : booking;
}

export function updateStoredBooking(
  idOrToken: string,
  partial: Partial<Booking>
): Booking | undefined {
  const bookings = getStoredBookings();
  const idx = bookings.findIndex((b) => b.id === idOrToken || b.public_token === idOrToken);

  if (idx < 0) return undefined;

  bookings[idx] = {
    ...bookings[idx],
    ...partial,
    updated_at: new Date().toISOString(),
  };

  saveStoredBookings(bookings);
  return bookings[idx];
}
