import { NextResponse } from 'next/server';
import { getStoredClients } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clients = getStoredClients();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ clients: [] });
  }
}
