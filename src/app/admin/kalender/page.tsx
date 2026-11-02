'use client';

import { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Building2,
  Home,
  Clock,
  User,
  MessageCircle,
} from 'lucide-react';
import { formatWIBDate, formatWIBTime, normalizeWhatsAppNumber } from '@/lib/utils';
import { Booking } from '@/types/database';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { id } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default function AdminKalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'bulanan' | 'mingguan'>('bulanan');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetch('/api/admin/bookings')
      .then((res) => res.json())
      .then((data) => {
        if (data.bookings) setBookings(data.bookings);
      })
      .catch(() => {});
  }, []);

  // Hitung grid kalender
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Senin
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Filter booking untuk hari yang dipilih
  const selectedDateBookings = bookings.filter((b) => {
    if (!b.start_at) return false;
    return isSameDay(new Date(b.start_at), selectedDate);
  });

  const nextPeriod = () => {
    setCurrentDate((prev) => (viewMode === 'bulanan' ? addMonths(prev, 1) : addDays(prev, 7)));
  };

  const prevPeriod = () => {
    setCurrentDate((prev) => (viewMode === 'bulanan' ? subMonths(prev, 1) : addDays(prev, -7)));
  };

  const weekDayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  return (
    <div className="space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Kalender Job MUA</h1>
          <p className="text-xs text-[#635354]">
            Visualisasi jadwal rias aktif dengan pembeda warna Studio vs Home Service.
          </p>
        </div>

        {/* Legend & Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-2xl border border-[#EBDCD5]">
            <span className="flex items-center gap-1.5 text-[#8C4247]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C97A7E]" />
              <span>Studio</span>
            </span>
            <span className="flex items-center gap-1.5 text-purple-700">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span>Home Service</span>
            </span>
          </div>

          <div className="flex bg-white border border-[#EBDCD5] rounded-2xl p-1">
            <button
              onClick={() => setViewMode('bulanan')}
              className={`text-xs px-3 py-1 rounded-xl font-medium transition-all ${
                viewMode === 'bulanan' ? 'bg-[#C97A7E] text-white' : 'text-[#635354]'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setViewMode('mingguan')}
              className={`text-xs px-3 py-1 rounded-xl font-medium transition-all ${
                viewMode === 'mingguan' ? 'bg-[#C97A7E] text-white' : 'text-[#635354]'
              }`}
            >
              Mingguan
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kalender Grid (2 Kolom di Desktop) */}
        <div className="lg:col-span-2 bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4">
          {/* Header Bulan & Navigasi */}
          <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
            <h2 className="font-serif font-bold text-base text-[#2D2424]">
              {format(currentDate, 'MMMM yyyy', { locale: id })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevPeriod}
                className="p-1.5 rounded-xl border border-[#EBDCD5] hover:bg-[#FDFBF7]"
              >
                <ChevronLeft className="w-4 h-4 text-[#635354]" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="text-xs px-3 py-1.5 rounded-xl border border-[#EBDCD5] hover:bg-[#FDFBF7] font-medium text-[#635354]"
              >
                Hari Ini
              </button>
              <button
                onClick={nextPeriod}
                className="p-1.5 rounded-xl border border-[#EBDCD5] hover:bg-[#FDFBF7]"
              >
                <ChevronRight className="w-4 h-4 text-[#635354]" />
              </button>
            </div>
          </div>

          {/* Grid Hari */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDayNames.map((d, i) => (
              <span key={i} className="text-[11px] font-bold text-[#9C8E8F] uppercase py-1">
                {d}
              </span>
            ))}

            {calendarDays.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              // Cari booking pada hari ini
              const dayBookings = bookings.filter(
                (b) =>
                  b.start_at &&
                  isSameDay(new Date(b.start_at), day) &&
                  ['dikonfirmasi', 'menunggu_pembayaran', 'selesai'].includes(b.status)
              );

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[70px] p-1.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#C97A7E] bg-[#FAEDF0]/50 shadow-xs'
                      : 'border-[#F1DADF]/50 hover:bg-[#FDFBF7]'
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-[#C97A7E] text-white'
                          : isSelected
                          ? 'text-[#8C4247]'
                          : 'text-[#2D2424]'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#FAEDF0] text-[#8C4247]">
                        {dayBookings.length} job
                      </span>
                    )}
                  </div>

                  {/* Dot / Mini Badge List */}
                  <div className="space-y-0.5 mt-1 overflow-hidden">
                    {dayBookings.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${
                          b.service_location === 'studio'
                            ? 'bg-[#FAEDF0] text-[#8C4247]'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {formatWIBTime(b.start_at)} {b.client?.name?.split(' ')[0]}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <span className="text-[8px] text-[#9C8E8F] block">
                        +{dayBookings.length - 2} lainnya
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Detail Hari Terpilih (1 Kolom di Desktop) */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#F1DADF]">
            <span className="text-[10px] text-[#9C8E8F] uppercase tracking-wider block font-semibold">
              Rincian Tanggal
            </span>
            <h3 className="font-serif font-bold text-base text-[#2D2424]">
              {formatWIBDate(selectedDate, 'EEEE, dd MMMM yyyy')}
            </h3>
          </div>

          {selectedDateBookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#9C8E8F] bg-[#FDFBF7] rounded-2xl border border-dashed border-[#EBDCD5]">
              Tidak ada jadwal rias di tanggal ini. Slot masih terbuka untuk booking.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateBookings.map((b) => {
                const isStudio = b.service_location === 'studio';
                return (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      {isStudio ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#FAEDF0] text-[#8C4247] px-2 py-0.5 rounded-full">
                          <Building2 className="w-3 h-3" />
                          <span>Studio Grisella</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                          <Home className="w-3 h-3" />
                          <span>Home Service</span>
                        </span>
                      )}

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'dikonfirmasi'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-[#2D2424]">{b.client?.name}</h4>
                      <p className="text-[11px] text-[#635354] font-medium">{b.makeup_type}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[#8C4247] font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatWIBTime(b.start_at)} WIB</span>
                    </div>

                    <p className="text-[10px] text-[#9C8E8F] line-clamp-1">
                      Alamat: {b.address}
                    </p>

                    {b.client?.phone && (
                      <a
                        href={`https://wa.me/${normalizeWhatsAppNumber(b.client.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#25D366] font-semibold pt-1 hover:underline"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat WhatsApp</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
