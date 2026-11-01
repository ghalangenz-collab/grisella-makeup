import { NextRequest, NextResponse } from 'next/server';
import { getStoredSchedule, getStoredSettings, getStoredBookings } from '@/lib/storage';
import { addMinutes, format, isAfter, isBefore, parse, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date'); // format: YYYY-MM-DD
    const duration = parseInt(searchParams.get('duration') || '90', 10);
    const location = (searchParams.get('location') || 'studio') as 'studio' | 'home';

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: 'Format tanggal harus YYYY-MM-DD' }, { status: 400 });
    }

    const targetDate = parse(dateStr, 'yyyy-MM-dd', new Date());
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // 1. Ambil setting buffer dan min jam same-day dari stored settings
    const settings = getStoredSettings();
    const bufferMinutes = location === 'home'
      ? parseInt(settings.buffer_home_minutes || '60', 10)
      : parseInt(settings.buffer_studio_minutes || '30', 10);
    const minHoursSameDay = parseInt(settings.min_hours_same_day || '3', 10);

    // 2. Ambil jam kerja dari stored schedule
    const schedule = getStoredSchedule();
    const wh = schedule.workingHours.find((w) => w.day_of_week === dayOfWeek);

    let startHour = 8;
    let startMinute = 0;
    let endHour = 20;
    let endMinute = 0;
    let isWorkDayActive = true;

    if (wh) {
      isWorkDayActive = wh.is_active;
      if (wh.start_time) {
        const parts = wh.start_time.split(':');
        startHour = parseInt(parts[0], 10) || 8;
        startMinute = parseInt(parts[1], 10) || 0;
      }
      if (wh.end_time) {
        const parts = wh.end_time.split(':');
        endHour = parseInt(parts[0], 10) || 20;
        endMinute = parseInt(parts[1], 10) || 0;
      }
    }

    if (!isWorkDayActive) {
      return NextResponse.json({
        date: dateStr,
        availableSlots: [],
        message: 'MUA libur pada hari ini.',
      });
    }

    // 3. Ambil booking yang aktif pada tanggal tersebut dari stored bookings
    const startOfDay = `${dateStr}T00:00:00+07:00`;
    const endOfDay = `${dateStr}T23:59:59+07:00`;

    const allBookings = getStoredBookings();
    const bookedRanges: { start: Date; end: Date }[] = [];

    allBookings.forEach((b) => {
      if (['menunggu_pembayaran', 'menunggu_verifikasi', 'dikonfirmasi', 'selesai'].includes(b.status)) {
        if (b.start_at && b.start_at >= startOfDay && b.start_at <= endOfDay) {
          try {
            bookedRanges.push({
              start: parseISO(b.start_at),
              end: parseISO(b.end_at),
            });
          } catch {}
        }
      }
    });

    // Ambil blocked slots
    schedule.blockedSlots.forEach((bs) => {
      if (bs.start_at && bs.start_at >= startOfDay && bs.start_at <= endOfDay) {
        try {
          bookedRanges.push({
            start: parseISO(bs.start_at),
            end: parseISO(bs.end_at),
          });
        } catch {}
      }
    });

    // 4. Generate kandidat slot setiap 30 menit
    const now = new Date();
    const availableSlots: string[] = [];

    let currentSlot = new Date(targetDate);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    const workEndTime = new Date(targetDate);
    workEndTime.setHours(endHour, endMinute, 0, 0);

    while (currentSlot < workEndTime) {
      const slotEnd = addMinutes(currentSlot, duration);

      // Cek apakah slot melebihi jam kerja MUA
      if (isAfter(slotEnd, workEndTime)) {
        break;
      }

      // Aturan same day: minimal X jam sebelum jam mulai
      const isToday =
        now.getFullYear() === targetDate.getFullYear() &&
        now.getMonth() === targetDate.getMonth() &&
        now.getDate() === targetDate.getDate();

      const earliestAllowed = addMinutes(now, minHoursSameDay * 60);
      const isSameDayValid = !isToday || isAfter(currentSlot, earliestAllowed);

      // Cek overlap dengan booking lain (termasuk buffer)
      const slotEffectiveEnd = addMinutes(slotEnd, bufferMinutes);

      const hasCollision = bookedRanges.some((booked) => {
        const bookedEffectiveEnd = addMinutes(booked.end, bufferMinutes);
        return (
          isBefore(currentSlot, bookedEffectiveEnd) &&
          isAfter(slotEffectiveEnd, booked.start)
        );
      });

      if (isSameDayValid && !hasCollision) {
        availableSlots.push(format(currentSlot, 'HH:mm'));
      }

      // Geser 30 menit
      currentSlot = addMinutes(currentSlot, 30);
    }

    return NextResponse.json({
      date: dateStr,
      availableSlots,
      bufferMinutes,
      durationMinutes: duration,
    });
  } catch (error) {
    console.error('Error calculating availability:', error);
    return NextResponse.json(
      { error: 'Gagal memeriksa ketersediaan jadwal' },
      { status: 500 }
    );
  }
}
