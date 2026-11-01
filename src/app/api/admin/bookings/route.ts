import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStoredBookings, getStoredClients, getStoredServices } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const localBookings = getStoredBookings();
    const clients = getStoredClients();
    const services = getStoredServices();

    // Hydrate local bookings
    const hydrated = localBookings.map((b) => ({
      ...b,
      client: b.client || clients.find((c) => c.id === b.client_id),
      service: b.service || services.find((s) => s.id === b.service_id),
    }));

    // Best-effort check if Supabase has additional bookings
    try {
      const supabase = createAdminClient();
      const { data: supabaseBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          client:clients (
            id,
            name,
            phone,
            phone_normalized
          )
        `)
        .order('start_at', { ascending: false });

      if (supabaseBookings && supabaseBookings.length > 0) {
        // Merge without duplicating
        const localIds = new Set(hydrated.map((b) => b.id));
        supabaseBookings.forEach((sb) => {
          if (!localIds.has(sb.id)) {
            hydrated.push(sb);
          }
        });
      }
    } catch {
      // Supabase offline, return local hydrated
    }

    return NextResponse.json({ bookings: hydrated });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json({ bookings: [] });
  }
}
