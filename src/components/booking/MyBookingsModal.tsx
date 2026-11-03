'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Search,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Receipt,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { formatRupiah, formatWIBDate, formatWIBTime } from '@/lib/utils';
import { Booking, BookingStatus } from '@/types/database';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyBookingsModal({ isOpen, onClose }: MyBookingsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Muat riwayat token booking yang pernah dilakukan di browser ini
  useEffect(() => {
    if (!isOpen) return;

    try {
      const storedTokens = JSON.parse(localStorage.getItem('grisella_bookings') || '[]');
      const lastToken = localStorage.getItem('grisella_last_token');
      const allTokens: string[] = Array.from(new Set([lastToken, ...storedTokens].filter(Boolean) as string[]));

      if (allTokens.length > 0) {
        setLoading(true);
        // Ambil data untuk token-token tersimpan
        Promise.all(
          allTokens.slice(0, 5).map((tok) =>
            fetch(`/api/bookings/${tok}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => data?.booking || null)
              .catch(() => null)
          )
        )
          .then((res) => {
            const valid = res.filter(Boolean) as Booking[];
            setRecentBookings(valid);
          })
          .finally(() => setLoading(false));
      }
    } catch {}
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/bookings/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.bookings || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'dikonfirmasi':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Jadwal Dikonfirmasi
          </span>
        );
      case 'menunggu_verifikasi':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
            Menunggu Verifikasi DP
          </span>
        );
      case 'menunggu_pembayaran':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
            <Clock className="w-3 h-3 text-rose-600" />
            Menunggu DP
          </span>
        );
      case 'menunggu_konfirmasi':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            <HelpCircle className="w-3 h-3 text-blue-600" />
            Review Admin
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
            {status}
          </span>
        );
    }
  };

  const displayList = hasSearched ? results : recentBookings;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#EBDCD5] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FAEDF0] border border-[#F1DADF] flex items-center justify-center text-[#C97A7E]">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#2D2424]">
                Cek Rincian & Status Booking
              </h3>
              <p className="text-[10px] text-[#635354]">
                Buka kembali detail jadwal & bukti transfer DP kamu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#9C8E8F] hover:text-[#2D2424] hover:bg-[#FAEDF0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Pencarian */}
        <form onSubmit={handleSearch} className="pt-3 pb-2 space-y-2">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ketik No WhatsApp (0851...) atau Kode Booking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-24 py-2.5 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] text-xs text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
            />
            <Search className="w-4 h-4 text-[#9C8E8F] absolute left-3 pointer-events-none" />
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="absolute right-1.5 py-1.5 px-3 rounded-xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-[11px] font-semibold transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cari'}
            </button>
          </div>
        </form>

        {/* Konten Daftar Booking */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-2">
          {loading && (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#C97A7E] mx-auto" />
              <p className="text-xs text-[#635354]">Mencari data reservasi...</p>
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <div className="py-8 text-center space-y-2 bg-[#FDFBF7] rounded-2xl border border-[#EBDCD5] p-4">
              <AlertCircle className="w-6 h-6 text-[#9C8E8F] mx-auto" />
              <p className="text-xs font-semibold text-[#2D2424]">Tidak Ditemukan Booking</p>
              <p className="text-[11px] text-[#635354]">
                Pastikan nomor WhatsApp atau token yang kamu masukkan sudah sesuai dengan saat reservasi.
              </p>
            </div>
          )}

          {!loading && !hasSearched && recentBookings.length === 0 && (
            <div className="py-8 text-center space-y-2 bg-[#FAEDF0]/40 rounded-2xl border border-[#F1DADF] p-4">
              <Sparkles className="w-6 h-6 text-[#C97A7E] mx-auto" />
              <p className="text-xs font-semibold text-[#2D2424]">Belum Ada Riwayat Booking</p>
              <p className="text-[11px] text-[#635354]">
                Kamu belum pernah melakukan reservasi di browser ini. Masukkan nomor WhatsApp kamu di atas untuk mencari jadwal.
              </p>
            </div>
          )}

          {!loading &&
            displayList.map((item) => (
              <div
                key={item.public_token || item.id}
                className="p-3.5 rounded-2xl border border-[#EBDCD5] hover:border-[#C97A7E] bg-[#FDFBF7] transition-all space-y-2 group shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-[#2D2424] block">
                      {item.makeup_type}
                    </span>
                    <span className="text-[10px] text-[#8C4247] font-medium block">
                      a.n. {item.client?.name || 'Pelanggan'}
                    </span>
                  </div>
                  <div>{renderStatusBadge(item.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#635354] pt-1 border-t border-[#F1DADF]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#C97A7E]" />
                    <span>{formatWIBDate(item.start_at, 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-[#C97A7E]" />
                    <span>{formatWIBTime(item.start_at)}</span>
                  </div>
                </div>

                {item.payment_receipt_url && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <FileCheck className="w-3 h-3 text-emerald-600" />
                    <span>Bukti DP Tersimpan ({item.payment_bank_name || 'Transfer'})</span>
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8C4247]">
                    DP: {formatRupiah(item.dp_amount)}
                  </span>
                  <Link
                    href={`/booking/${item.public_token || item.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 py-1 px-3 rounded-xl bg-white border border-[#C97A7E] text-[11px] font-semibold text-[#8C4247] group-hover:bg-[#C97A7E] group-hover:text-white transition-all shadow-2xs"
                  >
                    <span>Lihat Detail</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#F1DADF] text-center">
          <p className="text-[10px] text-[#9C8E8F]">
            Simpan atau bagikan link rincian bookingmu agar bisa dibuka kapan saja.
          </p>
        </div>
      </div>
    </div>
  );
}
