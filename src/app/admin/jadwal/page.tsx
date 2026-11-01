'use client';

import { useEffect, useState } from 'react';
import {
  Clock,
  Ban,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';
import { formatWIBDate, formatWIBTime } from '@/lib/utils';
import { WorkingHour, BlockedSlot } from '@/types/database';

export const dynamic = 'force-dynamic';

const DEFAULT_WORKING_HOURS: WorkingHour[] = [
  { id: 'wh-0', day_of_week: 0, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-1', day_of_week: 1, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-2', day_of_week: 2, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-3', day_of_week: 3, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-4', day_of_week: 4, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-5', day_of_week: 5, start_time: '08:00', end_time: '20:00', is_active: true },
  { id: 'wh-6', day_of_week: 6, start_time: '08:00', end_time: '20:00', is_active: true },
];

export default function AdminJadwalPage() {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(DEFAULT_WORKING_HOURS);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Blokir Manual
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('08:00');
  const [blockEndTime, setBlockEndTime] = useState('20:00');
  const [blockReason, setBlockReason] = useState('');
  const [submittingBlock, setSubmittingBlock] = useState(false);

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = () => {
    fetch('/api/admin/schedule')
      .then((res) => res.json())
      .then((data) => {
        if (data.workingHours && Array.isArray(data.workingHours) && data.workingHours.length > 0) {
          setWorkingHours(data.workingHours);
        }
        if (data.blockedSlots && Array.isArray(data.blockedSlots)) {
          setBlockedSlots(data.blockedSlots);
        }
      })
      .catch((err) => {
        console.error('Failed to load schedule:', err);
      });
  };

  const handleToggleDay = async (dayOfWeek: number, currentActive: boolean) => {
    const nextActive = !currentActive;

    // Optimistic UI update
    setWorkingHours((prev) => {
      const idx = prev.findIndex((w) => w.day_of_week === dayOfWeek);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], is_active: nextActive };
        return next;
      }
      return [...prev, { id: `wh-${dayOfWeek}`, day_of_week: dayOfWeek, start_time: '08:00', end_time: '20:00', is_active: nextActive }];
    });

    try {
      const res = await fetch('/api/admin/schedule/working-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: dayOfWeek, is_active: nextActive }),
      });

      if (!res.ok) throw new Error();

      showToast(`Hari ${dayNames[dayOfWeek]} sekarang ${nextActive ? 'Buka Operasional' : 'Libur / Tutup'}`);
    } catch {
      alert('Gagal memperbarui status hari');
      fetchSchedule();
    }
  };

  const handleTimeChange = async (
    dayOfWeek: number,
    field: 'start_time' | 'end_time',
    value: string
  ) => {
    // Optimistic UI update
    setWorkingHours((prev) => {
      const idx = prev.findIndex((w) => w.day_of_week === dayOfWeek);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: value };
        return next;
      }
      return [...prev, { id: `wh-${dayOfWeek}`, day_of_week: dayOfWeek, start_time: '08:00', end_time: '20:00', is_active: true, [field]: value }];
    });

    try {
      const res = await fetch('/api/admin/schedule/working-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: dayOfWeek, [field]: value }),
      });

      if (!res.ok) throw new Error();

      showToast(`Jam kerja ${dayNames[dayOfWeek]} diperbarui`);
    } catch {
      alert('Gagal memperbarui jam kerja');
      fetchSchedule();
    }
  };

  const handleAddBlockedSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) {
      alert('Pilih tanggal blokir');
      return;
    }

    setSubmittingBlock(true);
    try {
      const res = await fetch('/api/admin/schedule/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_at: `${blockDate}T${blockStartTime}:00+07:00`,
          end_at: `${blockDate}T${blockEndTime}:00+07:00`,
          reason: blockReason || 'Cuti / Tidak Ada Jadwal',
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (data.data) {
        setBlockedSlots((prev) => [...prev, data.data]);
      } else {
        fetchSchedule();
      }

      setBlockDate('');
      setBlockReason('');
      showToast('Tanggal/jam berhasil diblokir dari reservasi! 🔒');
    } catch {
      alert('Gagal menambah blokir jadwal');
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    if (!confirm('Buka kembali slot tanggal yang diblokir ini?')) return;

    try {
      const res = await fetch(`/api/admin/schedule/blocked-slots/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
        showToast('Blokir berhasil dihapus. Slot kini dapat dibooking kembali.');
      }
    } catch {
      alert('Gagal menghapus blokir');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-[#2D2424] text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-[#C97A7E] animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAEDF0] border border-[#F1DADF] text-[#8C4247] text-[11px] font-semibold mb-1">
          <Clock className="w-3.5 h-3.5 text-[#C97A7E]" />
          <span>Ketersediaan Waktu Operasional</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Jam Kerja & Blokir Jadwal</h1>
        <p className="text-xs text-[#635354] mt-0.5">
          Atur jadwal operasional harian MUA dan kunci tanggal khusus untuk libur atau acara pribadi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom 1: Jam Operasional Harian */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1DADF]">
            <div className="w-7 h-7 rounded-xl bg-[#FAEDF0] flex items-center justify-center text-[#C97A7E]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-sm text-[#2D2424]">Jam Buka Mingguan</h2>
              <span className="text-[10px] text-[#635354]">Klien hanya dapat memilih jam di rentang waktu buka</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {dayNames.map((name, dayIndex) => {
              const wh = workingHours.find((w) => w.day_of_week === dayIndex) || {
                id: `wh-${dayIndex}`,
                day_of_week: dayIndex,
                start_time: '08:00',
                end_time: '20:00',
                is_active: true,
              };

              return (
                <div
                  key={dayIndex}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                    wh.is_active
                      ? 'border-[#EBDCD5] bg-[#FDFBF7]'
                      : 'border-zinc-200 bg-zinc-50 opacity-60'
                  }`}
                >
                  <div className="w-24">
                    <span className="font-bold text-[#2D2424] block text-xs">{name}</span>
                    <span className={`text-[10px] font-semibold ${wh.is_active ? 'text-emerald-700' : 'text-zinc-500'}`}>
                      {wh.is_active ? '● Buka' : '○ Libur'}
                    </span>
                  </div>

                  {wh.is_active ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={wh.start_time ? wh.start_time.substring(0, 5) : '08:00'}
                        onChange={(e) => handleTimeChange(dayIndex, 'start_time', e.target.value)}
                        className="p-1.5 px-2 rounded-xl border border-[#EBDCD5] bg-white text-xs font-semibold text-[#2D2424]"
                      />
                      <span className="text-[11px] text-[#635354]">s/d</span>
                      <input
                        type="time"
                        value={wh.end_time ? wh.end_time.substring(0, 5) : '20:00'}
                        onChange={(e) => handleTimeChange(dayIndex, 'end_time', e.target.value)}
                        className="p-1.5 px-2 rounded-xl border border-[#EBDCD5] bg-white text-xs font-semibold text-[#2D2424]"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Tutup seharian</span>
                  )}

                  <button
                    onClick={() => handleToggleDay(dayIndex, wh.is_active)}
                    className={`px-3 py-1.5 rounded-xl font-semibold text-[11px] transition-colors ${
                      wh.is_active
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {wh.is_active ? 'Tutup' : 'Aktifkan'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom 2: Blokir Jadwal Manual / Cuti */}
        <div className="space-y-4">
          {/* Form Tambah Blokir */}
          <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F1DADF]">
              <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm text-[#2D2424]">Blokir Tanggal / Cuti</h2>
                <span className="text-[10px] text-[#635354]">Kunci slot tanggal agar klien tidak dapat memilih</span>
              </div>
            </div>

            <form onSubmit={handleAddBlockedSlot} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#2D2424]">
                  Pilih Tanggal <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#C97A7E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full p-2.5 pl-9 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1 text-[#2D2424]">Dari Jam</label>
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#EBDCD5] bg-white text-xs text-[#2D2424]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#2D2424]">Sampai Jam</label>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#EBDCD5] bg-white text-xs text-[#2D2424]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2D2424]">Alasan Blokir</label>
                <input
                  type="text"
                  placeholder="Cth: Cuti liburan keluarga / Job offline khusus"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingBlock}
                className="w-full py-3 rounded-2xl bg-[#C97A7E] hover:bg-[#B5676B] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{submittingBlock ? 'Menyimpan...' : 'Kunci / Blokir Tanggal Ini'}</span>
              </button>
            </form>
          </div>

          {/* Daftar Blokir Aktif */}
          <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-xs text-[#2D2424] flex items-center gap-1.5">
              <span>Daftar Tanggal / Slot yang Diblokir ({blockedSlots.length})</span>
            </h3>

            {blockedSlots.length === 0 ? (
              <p className="text-xs text-[#9C8E8F] text-center py-6 bg-[#FDFBF7] rounded-2xl border border-dashed border-[#EBDCD5]">
                Belum ada tanggal yang diblokir. Semua hari buka aktif normal.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {blockedSlots.map((bs) => (
                  <div
                    key={bs.id}
                    className="p-3 rounded-2xl border border-rose-200 bg-rose-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#8C4247] block">
                        {formatWIBDate(bs.start_at, 'EEEE, dd MMM yyyy')}
                      </span>
                      <span className="text-[11px] text-[#635354]">
                        {formatWIBTime(bs.start_at)} - {formatWIBTime(bs.end_at)} &bull; {bs.reason || 'Cuti'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteBlockedSlot(bs.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors"
                      title="Buka Kembali Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
