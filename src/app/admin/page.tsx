'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  Building2,
  Home,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Users,
  CheckCircle,
  FileCheck,
  Eye,
  X,
} from 'lucide-react';
import { formatRupiah, formatWIBDate, formatWIBTime, normalizeWhatsAppNumber } from '@/lib/utils';
import { Booking } from '@/types/database';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    todayBookingsCount: 0,
    actionRequiredCount: 0,
    verificationRequiredCount: 0,
    monthRevenue: 0,
    totalClients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchOverview = (isInitial = false) => {
    fetch('/api/admin/overview', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (isInitial) setLoading(false);
        if (data.bookings) setBookings(data.bookings);
        if (data.stats) setStats(data.stats);
      })
      .catch((err) => {
        if (isInitial) setLoading(false);
        console.error('Failed to load overview:', err);
      });
  };

  useEffect(() => {
    fetchOverview(true);

    const interval = setInterval(() => {
      fetchOverview(false);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleConfirmDpPayment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'dikonfirmasi',
          paid_dp_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error();

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'dikonfirmasi', paid_dp_at: new Date().toISOString() } : b))
      );
      setStats((prev) => ({
        ...prev,
        verificationRequiredCount: Math.max(0, prev.verificationRequiredCount - 1),
        actionRequiredCount: Math.max(0, prev.actionRequiredCount - 1),
      }));
      setToastMessage('Pembayaran DP berhasil dikonfirmasi langsung! ✨');
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      alert('Gagal mengonfirmasi pembayaran DP');
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = normalizeWhatsAppNumber(phone);
    const text = encodeURIComponent(
      `Halo kak ${name}! ✨ Saya Grisella Makeup, menghubungi terkait jadwal makeup kak ${name}. Ada yang bisa saya bantu persiapkan? 💕`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-[#2D2424] text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-[#C97A7E] animate-in fade-in slide-in-from-top-3">
          <CheckCircle className="w-4 h-4 text-[#25D366]" />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Welcome Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAEDF0] border border-[#F1DADF] text-[#8C4247] text-[11px] font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-[#C97A7E]" />
          <span>Panel Pemilik Bisnis MUA</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Halo, Grisella! ✨</h1>
        <p className="text-xs text-[#635354] mt-0.5">
          Berikut rangkuman aktivitas rias, verifikasi transfer DP, jadwal hari ini, dan laporan omset bisnismu.
        </p>
      </div>

      {/* Action Banner for Pending DP Verification */}
      {stats.verificationRequiredCount > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl flex items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 shrink-0">
              <FileCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-xs text-amber-950">
                Ada {stats.verificationRequiredCount} bukti transfer DP baru menunggu konfirmasi!
              </h2>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Klien telah mentransfer DP dan menunggu persetujuanmu agar jadwalnya terkunci.
              </p>
            </div>
          </div>
          <Link
            href="/admin/bookings?status=menunggu_verifikasi"
            className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Verifikasi Sekarang
          </Link>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Booking Hari Ini */}
        <div className="bg-white border border-[#EBDCD5] p-4 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#635354]">Jadwal Hari Ini</span>
            <div className="p-2 rounded-xl bg-[#FAEDF0] text-[#C97A7E]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#2D2424]">{stats.todayBookingsCount}</div>
          <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Jadwal aktif</span>
          </span>
        </div>

        {/* Menunggu Tindakan */}
        <div className="bg-white border border-[#EBDCD5] p-4 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#635354]">Perlu Tindakan</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-800">{stats.actionRequiredCount}</div>
          <span className="text-[10px] text-[#635354]">
            {stats.verificationRequiredCount > 0 ? `${stats.verificationRequiredCount} transfer DP` : 'Butuh konfirmasi MUA'}
          </span>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div className="bg-white border border-[#EBDCD5] p-4 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#635354]">Pemasukan Bulan Ini</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-800">
            {formatRupiah(stats.monthRevenue)}
          </div>
          <span className="text-[10px] text-[#635354]">DP + Pelunasan diterima</span>
        </div>

        {/* Total Database Klien */}
        <div className="bg-white border border-[#EBDCD5] p-4 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#635354]">Total Klien CRM</span>
            <div className="p-2 rounded-xl bg-[#F7F2EB] text-[#8C4247]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#2D2424]">{stats.totalClients}</div>
          <span className="text-[10px] text-[#635354]">Tersimpan di kontak</span>
        </div>
      </div>

      {/* Jadwal Terdekat */}
      <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C97A7E]" />
            <h2 className="font-serif font-bold text-sm text-[#2D2424]">Jadwal Rias Mendatang</h2>
          </div>
          <Link
            href="/admin/kalender"
            className="text-xs font-semibold text-[#8C4247] hover:text-[#C97A7E] flex items-center gap-0.5"
          >
            <span>Buka Kalender</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#9C8E8F]">
            Belum ada jadwal rias terdaftar untuk hari ini.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => {
              const isStudio = b.service_location === 'studio';
              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border border-[#EBDCD5] hover:border-[#C97A7E]/50 bg-[#FDFBF7] flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2D2424]">
                        {b.client?.name || 'Klien'}
                      </span>
                      {isStudio ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#FAEDF0] text-[#8C4247] px-2.5 py-0.5 rounded-full border border-[#F1DADF]">
                          <Building2 className="w-3 h-3" />
                          <span>Studio Grisella</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                          <Home className="w-3 h-3" />
                          <span>Home Service</span>
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                          b.status === 'dikonfirmasi'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : b.status === 'menunggu_verifikasi'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : b.status === 'menunggu_konfirmasi'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {b.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-[#2D2424]">
                      <strong>{b.makeup_type}</strong> &bull;{' '}
                      {formatWIBDate(b.start_at, 'EEEE, dd MMM yyyy')} pukul{' '}
                      <strong>{formatWIBTime(b.start_at)}</strong>
                    </p>

                    <p className="text-[11px] text-[#9C8E8F] line-clamp-1">
                      Lokasi: {b.address}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#F1DADF]">
                    {b.status === 'menunggu_verifikasi' && b.payment_receipt_url && (
                      <button
                        type="button"
                        onClick={() => setViewingReceiptUrl(b.payment_receipt_url!)}
                        className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Lihat Bukti Transfer DP"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-700" />
                        <span>Bukti DP</span>
                      </button>
                    )}

                    {b.status === 'menunggu_verifikasi' && (
                      <button
                        type="button"
                        onClick={() => handleConfirmDpPayment(b.id)}
                        className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Konfirmasi Pembayaran DP"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Konfirmasi DP</span>
                      </button>
                    )}

                    {b.client?.phone && (
                      <button
                        onClick={() => openWhatsApp(b.client!.phone, b.client!.name)}
                        className="py-2 px-3 rounded-xl bg-white border border-[#25D366] text-[#25D366] hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat WA</span>
                      </button>
                    )}

                    <Link
                      href={`/admin/bookings`}
                      className="py-2 px-4 rounded-xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold shadow-xs"
                    >
                      Kelola
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECEIPT VIEWER MODAL */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1DADF]">
              <span className="font-serif font-bold text-sm text-[#2D2424]">
                Foto Bukti Transfer DP
              </span>
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-h-96 rounded-2xl overflow-hidden border border-[#EBDCD5] bg-zinc-50 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingReceiptUrl}
                alt="Bukti Transfer DP"
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>

            <div className="flex items-center gap-2">
              <a
                href={viewingReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl border border-[#EBDCD5] text-[#2D2424] text-xs font-semibold text-center hover:bg-[#FAEDF0]/50"
              >
                Buka Tab Baru
              </a>
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="py-2 px-5 rounded-xl bg-[#C97A7E] text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
