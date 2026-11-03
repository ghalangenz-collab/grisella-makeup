'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  User,
  Phone,
  Mail,
  LogOut,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  PlusCircle,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Receipt,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { getUserSession, clearUserSession, UserProfile } from '@/lib/auth-user';
import { createClient } from '@/lib/supabase/client';
import { Booking, BookingStatus } from '@/types/database';
import { formatRupiah, formatWIBDate, formatWIBTime } from '@/lib/utils';

export default function UserAccountDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login?redirect=/akun');
      return;
    }
    setUser(session);
    setLoading(false);

    // Ambil riwayat booking user
    fetchUserBookings(session);
  }, [router]);

  const fetchUserBookings = async (session: UserProfile) => {
    setLoadingBookings(true);
    try {
      // 1. Cari berdasarkan nomor telepon atau email
      const searchTarget = session.phone || session.email;
      const res = await fetch(`/api/bookings/search?q=${encodeURIComponent(searchTarget)}`);
      if (res.ok) {
        const data = await res.json();
        setUserBookings(data.bookings || []);
      }
    } catch (e) {
      console.warn('Failed to load user bookings:', e);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    clearUserSession();
    router.push('/');
  };

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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#C97A7E]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <Navbar />

      <div className="max-w-md w-full mx-auto px-4 py-6 space-y-5 flex-1">
        {/* User Profile Card */}
        <div className="bg-white rounded-3xl p-5 border border-[#EBDCD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FAEDF0] border-2 border-[#F1DADF] flex items-center justify-center text-[#C97A7E] font-serif text-lg font-bold">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="font-serif font-bold text-base text-[#2D2424]">
                  {user?.full_name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8C4247] bg-[#FAEDF0] px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  <span>Pelanggan Grisella Makeup</span>
                </span>
              </div>
            </div>

            {/* Tombol Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-[#9C8E8F] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Keluar dari Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Rincian Kontak */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#FDFBF7] border border-[#EBDCD5] space-y-0.5">
              <span className="text-[10px] text-[#9C8E8F] flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#C97A7E]" />
                <span>Alamat Gmail</span>
              </span>
              <p className="font-semibold text-[#2D2424] truncate">{user?.email}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FDFBF7] border border-[#EBDCD5] space-y-0.5">
              <span className="text-[10px] text-[#9C8E8F] flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#C97A7E]" />
                <span>WhatsApp</span>
              </span>
              <p className="font-semibold text-[#2D2424] truncate">
                {user?.phone || '-'}
              </p>
            </div>
          </div>

          {/* Action Shortcut */}
          <div className="pt-1 flex gap-2">
            <Link
              href="/"
              className="flex-1 py-2.5 px-3 rounded-2xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Buat Reservasi Baru</span>
            </Link>
          </div>
        </div>

        {/* Riwayat Reservasi User */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-[#C97A7E]" />
              <h2 className="font-serif font-bold text-sm text-[#2D2424]">
                Riwayat & Jadwal Rias Saya
              </h2>
            </div>
            <span className="text-[11px] text-[#9C8E8F]">
              {userBookings.length} Jadwal
            </span>
          </div>

          {loadingBookings && (
            <div className="py-8 text-center space-y-2 bg-white rounded-3xl border border-[#EBDCD5] p-5">
              <Loader2 className="w-6 h-6 animate-spin text-[#C97A7E] mx-auto" />
              <p className="text-xs text-[#635354]">Memuat jadwal reservasi kamu...</p>
            </div>
          )}

          {!loadingBookings && userBookings.length === 0 && (
            <div className="py-8 text-center space-y-3 bg-white rounded-3xl border border-[#EBDCD5] p-6 shadow-2xs">
              <Sparkles className="w-8 h-8 text-[#C97A7E] mx-auto" />
              <div>
                <h3 className="font-serif font-bold text-sm text-[#2D2424]">
                  Belum Ada Jadwal Reservasi
                </h3>
                <p className="text-xs text-[#635354] mt-1 max-w-xs mx-auto">
                  Tampil memikat di momen spesialmu. Pilih tanggal dan kunci slot rias dengan mudah.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#C97A7E] text-white text-xs font-semibold shadow-xs"
              >
                <span>Reservasi Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {!loadingBookings &&
            userBookings.map((item) => (
              <div
                key={item.public_token || item.id}
                className="bg-white rounded-3xl p-4 border border-[#EBDCD5] hover:border-[#C97A7E] shadow-2xs space-y-2.5 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-xs text-[#2D2424]">
                      {item.makeup_type}
                    </h3>
                    <span className="text-[10px] text-[#8C4247] font-mono">
                      {item.public_token}
                    </span>
                  </div>
                  <div>{renderStatusBadge(item.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#635354] pt-2 border-t border-[#F1DADF]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#C97A7E]" />
                    <span>{formatWIBDate(item.start_at, 'dd MMMM yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-[#C97A7E]" />
                    <span>{formatWIBTime(item.start_at)}</span>
                  </div>
                </div>

                {item.payment_receipt_url && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bukti Transfer DP Tersimpan ({item.payment_bank_name || 'Bank'})</span>
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8C4247]">
                    DP: {formatRupiah(item.dp_amount)}
                  </span>

                  <Link
                    href={`/booking/${item.public_token || item.id}`}
                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-white border border-[#C97A7E] text-[11px] font-semibold text-[#8C4247] group-hover:bg-[#C97A7E] group-hover:text-white transition-all shadow-2xs"
                  >
                    <span>Lihat Rincian & Bukti</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
        </div>

        {/* Keuntungan Member Pelanggan */}
        <div className="p-4 rounded-3xl bg-[#FAEDF0]/50 border border-[#F1DADF] space-y-2 text-xs">
          <span className="font-serif font-bold text-xs text-[#8C4247] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#C97A7E]" />
            <span>Keuntungan Akun Pelanggan Grisella</span>
          </span>
          <ul className="text-[11px] text-[#635354] space-y-1 list-disc list-inside leading-relaxed">
            <li>Formulir booking otomatis terisi tanpa perlu ketik ulang nama & no WhatsApp.</li>
            <li>Riwayat pembayaran dan foto struk transfer DP tersimpan permanen.</li>
            <li>Notifikasi perubahan jadwal langsung terhubung ke nomor WhatsApp kamu.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
