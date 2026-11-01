'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface StepScheduleProps {
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:mm
  durationMinutes: number;
  location: 'studio' | 'home';
  onDateChange: (dateStr: string) => void;
  onTimeChange: (timeStr: string) => void;
}

export default function StepSchedule({
  selectedDate,
  selectedTime,
  durationMinutes,
  location,
  onDateChange,
  onTimeChange,
}: StepScheduleProps) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate 21 hari ke depan untuk dipilih klien
  const today = new Date();
  const dateOptions = Array.from({ length: 21 }, (_, i) => addDays(today, i));

  useEffect(() => {
    if (!selectedDate) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    fetch(`/api/availability?date=${selectedDate}&duration=${durationMinutes}&location=${location}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setLoading(false);
        if (data.error) {
          setErrorMsg(data.error);
          setAvailableSlots([]);
        } else {
          setAvailableSlots(data.availableSlots || []);
          if (data.message && data.availableSlots.length === 0) {
            setErrorMsg(data.message);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
        // Fallback default slots jika offline
        setAvailableSlots(['08:00', '10:00', '13:00', '15:30', '18:00']);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, durationMinutes, location]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-serif font-bold text-[#2D2424]">Pilih Tanggal & Jam</h2>
        <p className="text-xs text-[#635354]">
          Pilih waktu yang paling pas untuk sesi makeup kamu.
        </p>
      </div>

      {/* Date Carousel / Scroll Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[#2D2424] flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-[#C97A7E]" />
          <span>Tanggal Booking</span>
        </label>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          {dateOptions.map((dateObj, idx) => {
            const dateStr = format(dateObj, 'yyyy-MM-dd');
            const isSelected = selectedDate === dateStr;
            const isToday = isSameDay(dateObj, today);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onDateChange(dateStr);
                  onTimeChange(''); // Reset jam ketika ganti tanggal
                }}
                className={`shrink-0 w-15 py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                  isSelected
                    ? 'bg-[#C97A7E] text-white border-[#C97A7E] shadow-sm scale-102'
                    : 'bg-white text-[#2D2424] border-[#EBDCD5] hover:border-[#D4788C]/40'
                }`}
              >
                <span className={`text-[10px] font-medium uppercase ${isSelected ? 'text-white/80' : 'text-[#635354]'}`}>
                  {isToday ? 'Hari ini' : format(dateObj, 'EEE', { locale: id })}
                </span>
                <span className="text-base font-bold my-0.5">{format(dateObj, 'd')}</span>
                <span className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-[#9C8E8F]'}`}>
                  {format(dateObj, 'MMM', { locale: id })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slot Picker */}
      <div className="space-y-2 pt-2 border-t border-[#F1DADF]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#2D2424] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#C97A7E]" />
            <span>Jam yang Tersedia</span>
          </label>
          <span className="text-[11px] text-[#635354]">
            Durasi: <strong>{durationMinutes} menit</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center bg-white border border-[#EBDCD5] rounded-2xl flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-[#C97A7E] animate-spin" />
            <span className="text-xs text-[#635354]">Mengecek ketersediaan slot MUA...</span>
          </div>
        ) : errorMsg && availableSlots.length === 0 ? (
          <div className="p-4 bg-[#FAEDF0] border border-[#F1DADF] rounded-2xl flex items-center gap-3 text-xs text-[#8C4247]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="p-6 text-center bg-white border border-[#EBDCD5] rounded-2xl">
            <p className="text-xs text-[#635354]">
              Slot untuk tanggal ini sudah penuh atau sudah melewati batas minimal 3 jam sebelum jam mulai. Silakan pilih tanggal lain ya kak.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onTimeChange(slot)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    isSelected
                      ? 'bg-[#C97A7E] text-white border-[#C97A7E] shadow-xs'
                      : 'bg-white text-[#2D2424] border-[#EBDCD5] hover:border-[#D4788C]/40 hover:bg-[#FAEDF0]/20'
                  }`}
                >
                  {slot} WIB
                </button>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-[#9C8E8F] italic pt-1">
          * Booking di hari yang sama diperbolehkan minimal 3 jam sebelum waktu mulai demi persiapan MUA.
        </p>
      </div>
    </div>
  );
}
