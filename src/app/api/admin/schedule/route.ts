import { NextResponse } from 'next/server';
import { getStoredSchedule } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const schedule = getStoredSchedule();
    return NextResponse.json({
      workingHours: schedule.workingHours,
      blockedSlots: schedule.blockedSlots,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ workingHours: [], blockedSlots: [] });
  }
}
