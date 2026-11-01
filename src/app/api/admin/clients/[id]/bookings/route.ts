import { NextRequest, NextResponse } from 'next/server';
import { getStoredBookings } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const allBookings = getStoredBookings();
    const bookings = allBookings.filter((b) => b.client_id === id);

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ bookings: [] });
  }
}
