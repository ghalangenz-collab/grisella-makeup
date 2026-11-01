'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  Building2,
  Home,
  MessageCircle,
  X,
  FileCheck,
  Eye,
  AlertCircle,
  Sparkles,
  Phone,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { formatRupiah, formatWIBDate, formatWIBTime } from '@/lib/utils';
import { Booking, BookingStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  // Form custom harga/durasi
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [customDuration, setCustomDuration] = useState<number>(90);

  // Form pelunasan
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [settlementMethod, setSettlementMethod] = useState<'tunai' | 'transfer'>('transfer');

  const [dpPercentage, setDpPercentage] = useState(30);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchBookings();

    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.dp_percentage) {
          setDpPercentage(parseInt(data.settings.dp_percentage, 10) || 30);
        }
      })
      .catch(() => {});

    if (typeof window !== 'undefined') {
      const urlStatus = new URLSearchParams(window.location.search).get('status');
      if (urlStatus) {
        setFilterStatus(urlStatus);
      }
    }
  }, []);

  const fetchBookings = () => {
    fetch('/api/admin/bookings')
      .then((res) => res.json())
      .then((data) => {
        if (data.bookings && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        }
      })
      .catch((err) => console.error('Failed to load bookings:', err));
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    setLoading(true);
    try {
      const payload: Record<string, any> = { status: newStatus };
      if (newStatus === 'dikonfirmasi') {
        payload.paid_dp_at = new Date().toISOString();
      }

      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (data.booking) {
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, ...data.booking } : b)));
      } else {
        fetchBookings();
      }

      setSelectedBooking(null);
      showToast(`Status booking berhasil diubah menjadi: ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch {
      alert('Gagal memperbarui status');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDpPayment = async () => {
    if (!selectedBooking) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'dikonfirmasi',
          paid_dp_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (data.booking) {
        setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? { ...b, ...data.booking } : b)));
      } else {
        fetchBookings();
      }

      setSelectedBooking(null);
      showToast('Pembayaran DP berhasil dikonfirmasi! Jadwal otomatis terkunci. ✨');
    } catch {
      alert('Gagal mengonfirmasi pembayaran DP');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCustom = async () => {
    if (!selectedBooking) return;
    setLoading(true);
    try {
      const total = customPrice + (selectedBooking.transport_fee || 0);
      const dp = Math.round(total * (dpPercentage / 100));

      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'menunggu_pembayaran',
          total_price: total,
          dp_amount: dp,
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (data.booking) {
        setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? { ...b, ...data.booking } : b)));
      } else {
        fetchBookings();
      }

      setSelectedBooking(null);
      showToast('Tarif kustom disetujui! Tagihan DP telah diterbitkan untuk klien.');
    } catch {
      alert('Gagal menyetujui tarif custom');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSettlement = async () => {
    if (!selectedBooking) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'selesai',
          paid_settlement_at: new Date().toISOString(),
          settlement_amount: settlementAmount,
          settlement_method: settlementMethod,
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (data.booking) {
        setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? { ...b, ...data.booking } : b)));
      } else {
        fetchBookings();
      }

      setSelectedBooking(null);
      showToast('Pelunasan dicatat & layanan selesai! ✨');
    } catch {
      alert('Gagal mencatat pelunasan');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (b: Booking) => {
    const phone = b.client?.phone || '';
    const name = b.client?.name || 'Kak';
    const text = encodeURIComponent(
      `Halo kak ${name}! ✨ Saya Grisella Makeup, menghubungi terkait pesanan makeup ${b.makeup_type} (Kode: ${b.public_token}). Ada yang ingin dikonsultasikan? 💕`
    );
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  const filteredBookings = bookings.filter((b) => {
    const matchStatus = filterStatus === 'semua' || b.status === filterStatus;
    const matchSearch =
      (b.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (b.client?.phone?.includes(searchQuery) || false) ||
      (b.makeup_type?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (b.public_token?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    return matchStatus && matchSearch;
  });

  const waitingVerificationCount = bookings.filter((b) => b.status === 'menunggu_verifikasi').length;

  const statusTabs = [
    { key: 'semua', label: 'Semua' },
    {
      key: 'menunggu_verifikasi',
      label: `Verifikasi DP (${waitingVerificationCount})`,
      highlight: waitingVerificationCount > 0,
    },
    { key: 'menunggu_konfirmasi', label: 'Menunggu Konfirmasi' },
    { key: 'menunggu_pembayaran', label: 'Menunggu Bayar' },
    { key: 'dikonfirmasi', label: 'Dikonfirmasi' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'batal', label: 'Batal' },
    { key: 'kedaluwarsa', label: 'Kedaluwarsa' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-[#2D2424] text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-[#C97A7E] animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAEDF0] border border-[#F1DADF] text-[#8C4247] text-[11px] font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C97A7E]" />
            <span>Manajemen Reservasi & Pembayaran</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Daftar Booking Masuk</h1>
          <p className="text-xs text-[#635354] mt-0.5">
            Pantau reservasi klien, verifikasi bukti transfer DP, dan catat pelunasan di hari H.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#9C8E8F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, WA, token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-2xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] shadow-xs"
          />
        </div>
      </div>

      {/* Urgent Notice for Pending Verifications */}
      {waitingVerificationCount > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <FileCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-amber-950">
                Ada {waitingVerificationCount} bukti transfer DP menunggu konfirmasi MUA!
              </h3>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Klien telah mengunggah struk transfer. Segera periksa dan konfirmasi agar jadwalnya terkunci.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('menunggu_verifikasi')}
            className="shrink-0 py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors"
          >
            Tampilkan
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {statusTabs.map((tab) => {
          const isActive = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#C97A7E] text-white shadow-xs'
                  : tab.highlight
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                  : 'bg-white border border-[#EBDCD5] text-[#635354] hover:bg-[#FAEDF0]/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      <div className="bg-white border border-[#EBDCD5] rounded-3xl p-4 shadow-xs space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#9C8E8F] space-y-1">
            <p>Tidak ada reservasi yang sesuai dengan filter pencarian.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const isStudio = b.service_location === 'studio';
              const hasReceipt = Boolean(b.payment_receipt_url);

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    b.status === 'menunggu_verifikasi'
                      ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200'
                      : 'border-[#EBDCD5] hover:border-[#C97A7E]/50 bg-[#FDFBF7]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#2D2424]">
                        {b.client?.name || 'Klien'}
                      </span>

                      {isStudio ? (
                        <span className="text-[10px] font-semibold bg-[#FAEDF0] text-[#8C4247] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[#F1DADF]">
                          <Building2 className="w-3 h-3" />
                          <span>Studio Grisella</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                          <Home className="w-3 h-3" />
                          <span>Home Service</span>
                        </span>
                      )}

                      {/* Status Badges */}
                      {b.status === 'menunggu_verifikasi' && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700 animate-spin" />
                          <span>MENUNGGU VERIFIKASI DP</span>
                        </span>
                      )}
                      {b.status === 'dikonfirmasi' && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          DIKONFIRMASI
                        </span>
                      )}
                      {b.status === 'menunggu_pembayaran' && (
                        <span className="text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full">
                          MENUNGGU PEMBAYARAN
                        </span>
                      )}
                      {b.status === 'menunggu_konfirmasi' && (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          PERLU ACC TARIF
                        </span>
                      )}
                      {b.status === 'selesai' && (
                        <span className="text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full">
                          SELESAI
                        </span>
                      )}
                      {(b.status === 'batal' || b.status === 'kedaluwarsa') && (
                        <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-300 px-2.5 py-0.5 rounded-full">
                          {b.status.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#2D2424] font-medium">
                      <strong>{b.makeup_type}</strong> &bull;{' '}
                      <span className="text-[#635354]">
                        {formatWIBDate(b.start_at, 'EEEE, dd MMM yyyy')} ({formatWIBTime(b.start_at)})
                      </span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#635354]">
                      <span>Total: <strong className="text-[#2D2424]">{formatRupiah(b.total_price)}</strong></span>
                      <span>DP: <strong className="text-[#8C4247]">{formatRupiah(b.dp_amount)}</strong></span>
                      {b.status === 'dikonfirmasi' && (
                        <span className="text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md">
                          Sisa Pelunasan: <strong>{formatRupiah(b.total_price - b.dp_amount)}</strong>
                        </span>
                      )}
                    </div>

                    {hasReceipt && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingReceiptUrl(b.payment_receipt_url!)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Bukti Transfer DP</span>
                        </button>
                        {b.payment_sender_name && (
                          <span className="text-[11px] text-[#635354]">
                            (Pengirim: {b.payment_sender_name})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#F1DADF]">
                    {b.client?.phone && (
                      <button
                        onClick={() => openWhatsApp(b)}
                        className="py-2 px-3 rounded-xl bg-white border border-[#25D366] text-[#25D366] hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Chat Klien di WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat WA</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedBooking(b);
                        setCustomPrice(b.total_price || 450000);
                        setSettlementAmount(b.total_price - b.dp_amount);
                      }}
                      className="py-2 px-4 rounded-xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Kelola & Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL KELOLA & DETAIL BOOKING */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#2D2424]">Detail & Kelola Reservasi</h3>
                <span className="text-[10px] text-[#9C8E8F] font-mono">{selectedBooking.public_token}</span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-xl text-[#635354] hover:bg-[#FAEDF0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rincian Klien & Jadwal */}
            <div className="p-4 bg-[#FDFBF7] border border-[#EBDCD5] rounded-2xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#635354]">Nama Klien:</span>
                <span className="font-semibold text-[#2D2424]">
                  {selectedBooking.client?.name} ({selectedBooking.client?.phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#635354]">Layanan:</span>
                <span className="font-semibold text-[#2D2424]">{selectedBooking.makeup_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#635354]">Waktu Acara:</span>
                <span className="font-semibold text-[#2D2424]">
                  {formatWIBDate(selectedBooking.start_at, 'dd MMMM yyyy')} ({formatWIBTime(selectedBooking.start_at)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#635354]">Lokasi:</span>
                <span className="font-semibold text-[#2D2424]">
                  {selectedBooking.service_location === 'studio' ? 'Studio Grisella Makeup' : selectedBooking.address}
                </span>
              </div>
              {selectedBooking.custom_request && (
                <div className="p-2.5 bg-[#FAEDF0] rounded-xl text-[11px] text-[#8C4247] mt-1">
                  <strong>Permintaan Kustom:</strong> &ldquo;{selectedBooking.custom_request}&rdquo;
                </div>
              )}
            </div>

            {/* KHUSUS: BUKTI TRANSFER DP (MENUNGGU VERIFIKASI) */}
            {selectedBooking.payment_receipt_url && (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <FileCheck className="w-4 h-4 text-amber-700" />
                    <span>Bukti Transfer DP Diunggah Klien</span>
                  </div>
                  <span className="text-[10px] text-amber-800">
                    Nominal DP: {formatRupiah(selectedBooking.dp_amount)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    onClick={() => setViewingReceiptUrl(selectedBooking.payment_receipt_url!)}
                    className="w-24 h-24 rounded-xl border border-amber-300 bg-white overflow-hidden cursor-pointer shadow-xs hover:opacity-90 relative group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedBooking.payment_receipt_url}
                      alt="Bukti Transfer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">
                      Perbesar
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="block text-[#635354]">
                      Nama Pengirim:{' '}
                      <strong className="text-[#2D2424]">
                        {selectedBooking.payment_sender_name || selectedBooking.client?.name || '-'}
                      </strong>
                    </span>
                    <span className="block text-[#635354]">
                      Bank Pengirim:{' '}
                      <strong className="text-[#2D2424]">
                        {selectedBooking.payment_bank_name || 'Transfer Bank'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewingReceiptUrl(selectedBooking.payment_receipt_url!)}
                      className="text-[11px] text-[#C97A7E] hover:underline font-semibold"
                    >
                      Buka Foto Bukti Ukuran Penuh &rarr;
                    </button>
                  </div>
                </div>

                {selectedBooking.status === 'menunggu_verifikasi' && (
                  <button
                    onClick={handleConfirmDpPayment}
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi Pembayaran DP (Kunci Jadwal)</span>
                  </button>
                )}
              </div>
            )}

            {/* Khusus Booking Menunggu Konfirmasi (Layanan Lainnya / Kustom) */}
            {selectedBooking.status === 'menunggu_konfirmasi' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-blue-950">Tetapkan Harga Layanan Custom</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                    Harga Layanan (Rp)
                  </label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-blue-200 bg-white"
                  />
                </div>
                <button
                  onClick={handleConfirmCustom}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  Setujui & Terbitkan Tagihan DP ke Klien
                </button>
              </div>
            )}

            {/* Khusus Catat Pelunasan di Hari H (untuk booking Dikonfirmasi) */}
            {selectedBooking.status === 'dikonfirmasi' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-emerald-950">Catat Pelunasan Sisa Biaya</h4>
                <div className="flex justify-between text-xs text-emerald-900">
                  <span>Sisa Tagihan yang Harus Dibayar:</span>
                  <strong>{formatRupiah(selectedBooking.total_price - selectedBooking.dp_amount)}</strong>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettlementMethod('tunai')}
                    className={`py-2 text-xs rounded-xl border font-semibold ${
                      settlementMethod === 'tunai'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white border-emerald-200 text-emerald-900'
                    }`}
                  >
                    Tunai / Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlementMethod('transfer')}
                    className={`py-2 text-xs rounded-xl border font-semibold ${
                      settlementMethod === 'transfer'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white border-emerald-200 text-emerald-900'
                    }`}
                  >
                    Transfer Bank
                  </button>
                </div>

                <button
                  onClick={handleRecordSettlement}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  Tandai Lunas & Selesaikan Layanan
                </button>
              </div>
            )}

            {/* Ubah Status Manual */}
            <div className="space-y-2 pt-2 border-t border-[#F1DADF]">
              <span className="text-[11px] font-semibold text-[#635354] block">
                Ubah Status Manual:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'dikonfirmasi')}
                  className="py-2 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold"
                >
                  Dikonfirmasi
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'selesai')}
                  className="py-2 px-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-semibold"
                >
                  Selesai
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'batal')}
                  className="py-2 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold"
                >
                  Batalkan
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'kedaluwarsa')}
                  className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold"
                >
                  Kedaluwarsa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN RECEIPT VIEWER MODAL */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-4 max-w-lg w-full max-h-[90vh] flex flex-col space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1DADF]">
              <span className="font-serif font-bold text-xs text-[#2D2424]">
                Foto Struk Bukti Transfer DP
              </span>
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="p-1 rounded-full bg-[#FAEDF0] text-[#635354]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto max-h-[70vh] flex items-center justify-center bg-[#FDFBF7] rounded-2xl border border-[#EBDCD5] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingReceiptUrl}
                alt="Foto Struk"
                className="max-h-full max-w-full object-contain rounded-xl"
              />
            </div>
            <button
              onClick={() => setViewingReceiptUrl(null)}
              className="py-2 rounded-xl bg-[#2D2424] text-white text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
