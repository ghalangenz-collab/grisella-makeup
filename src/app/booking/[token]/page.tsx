'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Booking, BookingStatus, BankAccount } from '@/types/database';
import { formatRupiah, formatWIBDate, formatWIBTime } from '@/lib/utils';
import {
  Clock,
  MapPin,
  Calendar,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  ArrowLeft,
  Share2,
  Copy,
  Sparkles,
  QrCode,
  CreditCard,
  Upload,
  Maximize2,
  Download,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function BookingStatusPage({ params }: PageProps) {
  const { token } = use(params);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Payment method tab: 'qris' | 'bank'
  const [activePaymentMethod, setActivePaymentMethod] = useState<'qris' | 'bank'>('qris');

  // Zoom QRIS modal state
  const [showQrisModal, setShowQrisModal] = useState(false);

  // Upload receipt state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchBookingData(isMounted);

    return () => {
      isMounted = false;
    };
  }, [token]);

  const fetchBookingData = (isMounted = true) => {
    fetch(`/api/bookings/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setLoading(false);
        if (data.booking) {
          setBooking(data.booking);
        }
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.bank_accounts) {
            try {
              const parsed = JSON.parse(data.settings.bank_accounts);
              if (Array.isArray(parsed)) setBankAccounts(parsed);
            } catch {}
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
  };

  // Countdown timer 30 menit untuk status menunggu_pembayaran
  useEffect(() => {
    if (!booking?.expires_at || booking.status !== 'menunggu_pembayaran') return;

    const interval = setInterval(() => {
      const diff = new Date(booking.expires_at!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Waktu Habis');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const copyBookingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyDpAmount = () => {
    if (!booking) return;
    navigator.clipboard.writeText(String(booking.dp_amount));
    setCopiedNominal(true);
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  const copyBankAccount = (id: string, num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedBankId(id);
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  const handleSelectReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      alert('Pilih foto bukti transfer terlebih dahulu');
      return;
    }

    setIsSubmittingProof(true);
    try {
      // 1. Upload receipt image
      const formData = new FormData();
      formData.append('file', receiptFile);
      formData.append('category', 'receipts');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Gagal mengunggah foto');

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      // 2. Submit payment proof to booking
      const proofRes = await fetch(`/api/bookings/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_receipt_url: imageUrl,
          payment_sender_name: senderName || booking?.client?.name || 'Klien',
          payment_bank_name: senderBank || 'Transfer',
        }),
      });

      if (!proofRes.ok) throw new Error('Gagal menyimpan konfirmasi');

      const proofData = await proofRes.json();
      if (proofData.booking) {
        setBooking(proofData.booking);
      } else {
        fetchBookingData(true);
      }

      setReceiptFile(null);
      setReceiptPreview(null);
      alert('Bukti transfer DP berhasil dikirim! Menunggu konfirmasi MUA Grisella 💕');
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala saat mengirim bukti transfer. Silakan hubungi WA MUA.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'dikonfirmasi':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Jadwal Dikonfirmasi</span>
          </div>
        );
      case 'menunggu_verifikasi':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span>Menunggu Konfirmasi DP</span>
          </div>
        );
      case 'menunggu_pembayaran':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
            <Clock className="w-4 h-4 text-[#C97A7E] animate-pulse" />
            <span>Menunggu Pembayaran DP</span>
          </div>
        );
      case 'menunggu_konfirmasi':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Menunggu Konfirmasi Admin</span>
          </div>
        );
      case 'selesai':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Layanan Selesai</span>
          </div>
        );
      case 'batal':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Booking Dibatalkan</span>
          </div>
        );
      case 'kedaluwarsa':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-300">
            <AlertCircle className="w-4 h-4 text-zinc-500" />
            <span>Batas Waktu Pembayaran Habis</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getWaLink = () => {
    const muaPhone = settings.mua_whatsapp || '6281234567890';
    const clientName = booking?.client?.name || 'Klien';
    const makeup = booking?.makeup_type || 'Makeup';
    const text = encodeURIComponent(
      `Halo kak Grisella! ✨ Saya ${clientName}, ingin menanyakan perihal booking saya: ${makeup} (Kode Token: ${token}). Terima kasih!`
    );
    return `https://wa.me/${muaPhone}?text=${text}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex flex-col">
        <Navbar whatsappNumber={settings.mua_whatsapp} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-8 h-8 border-3 border-[#C97A7E] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-[#635354]">Memuat detail reservasi...</p>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex flex-col">
        <Navbar whatsappNumber={settings.mua_whatsapp} />
        <div className="flex-1 max-w-md mx-auto p-6 text-center flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-[#C97A7E] mb-3" />
          <h2 className="text-lg font-serif font-bold text-[#2D2424]">Booking Tidak Ditemukan</h2>
          <p className="text-xs text-[#635354] mt-1 mb-6">
            Token reservasi tidak valid atau tautan sudah kedaluwarsa.
          </p>
          <Link
            href="/"
            className="py-3 px-6 rounded-2xl bg-[#C97A7E] text-white text-xs font-semibold shadow-xs"
          >
            Buat Reservasi Baru
          </Link>
        </div>
      </main>
    );
  }

  const qrisUrl = settings.qris_image_url || '/images/qris-grisella.svg';

  return (
    <main className="min-h-screen bg-[#FDFBF7] flex flex-col pb-16">
      <Navbar whatsappNumber={settings.mua_whatsapp} />

      <div className="max-w-md mx-auto w-full px-4 pt-5 space-y-4">
        {/* Navigation & Share */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-[#635354] hover:text-[#C97A7E] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>

          <button
            onClick={copyBookingLink}
            className="inline-flex items-center gap-1.5 text-xs text-[#8C4247] bg-[#FAEDF0] hover:bg-[#F5DAE0] px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer"
          >
            <Share2 className="w-3 h-3" />
            <span>{copiedLink ? 'Link Tersalin!' : 'Bagikan Link'}</span>
          </button>
        </div>

        {/* Status Card Banner */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs text-center space-y-3">
          <div className="flex justify-center">{getStatusBadge(booking.status)}</div>

          <div className="space-y-1">
            <span className="text-[10px] text-[#9C8E8F] uppercase tracking-wider block font-medium">
              Kode Reservasi
            </span>
            <span className="font-mono text-xs font-bold text-[#2D2424] bg-[#F7F2EB] px-3 py-1 rounded-lg inline-block border border-[#EBDCD5]">
              {booking.public_token}
            </span>
          </div>

          {/* Sisa Waktu Bayar DP */}
          {booking.status === 'menunggu_pembayaran' && (
            <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl">
              <span className="text-[11px] text-amber-900 block font-medium">
                Sisa Waktu Pembayaran DP:
              </span>
              <span className="font-mono text-2xl font-bold text-amber-950 block my-0.5">
                {timeLeft || '30:00'}
              </span>
              <p className="text-[10px] text-amber-800/80">
                Slot jadwal akan otomatis dibuka kembali jika bukti transfer DP belum diunggah dalam 30 menit.
              </p>
            </div>
          )}

          {/* Menunggu Verifikasi Bukti DP */}
          {booking.status === 'menunggu_verifikasi' && (
            <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Bukti Transfer Berhasil Diterima 🌸</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                MUA Grisella sedang mencocokkan mutasi transfer DP kamu. Status jadwal akan segera berubah menjadi <strong>Jadwal Dikonfirmasi</strong> dalam beberapa menit.
              </p>
              {booking.payment_receipt_url && (
                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={booking.payment_receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-50"
                  >
                    <span>Lihat Foto Bukti Transfer</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Permintaan Custom Sedang Ditinjau */}
          {booking.status === 'menunggu_konfirmasi' && (
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-left text-xs text-blue-900 space-y-1">
              <span className="font-bold block">Permintaan Custom Diterima ✨</span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                MUA sedang meninjau detail look & estimasi durasi. Setelah admin menyetujui, metode pembayaran QRIS & Rekening Transfer DP akan aktif di halaman ini.
              </p>
            </div>
          )}

          {/* Jadwal Terkonfirmasi */}
          {booking.status === 'dikonfirmasi' && (
            <div className="p-4 bg-[#FAEDF0]/70 border border-[#F1DADF] rounded-2xl text-center space-y-1">
              <span className="font-serif font-bold text-sm text-[#8C4247] block">
                Selamat, Jadwal Riasmu Terkonfirmasi! 🎉
              </span>
              <p className="text-[11px] text-[#635354]">
                DP sebesar <strong>{formatRupiah(booking.dp_amount)}</strong> telah lunas diverifikasi. Sampai jumpa di hari H!
              </p>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* PAYMENT METHODS SECTION (QRIS & BANK ACCOUNTS - NO MIDTRANS) */}
        {/* ============================================================== */}
        {booking.status === 'menunggu_pembayaran' && (
          <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-[#F1DADF] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#2D2424]">Instruksi Pembayaran DP</h3>
                <span className="text-[10px] text-[#635354]">Pilih Scan QRIS atau Transfer Bank Manual</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#9C8E8F] block">Nominal DP ({settings.dp_percentage || '30'}%)</span>
                <div className="flex items-center gap-1 justify-end">
                  <span className="font-bold text-sm text-[#8C4247]">
                    {formatRupiah(booking.dp_amount)}
                  </span>
                  <button
                    onClick={copyDpAmount}
                    className="p-1 rounded-md text-[#8C4247] hover:bg-[#FAEDF0]"
                    title="Salin Nominal DP"
                  >
                    {copiedNominal ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#FDFBF7] border border-[#EBDCD5] rounded-2xl">
              <button
                type="button"
                onClick={() => setActivePaymentMethod('qris')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activePaymentMethod === 'qris'
                    ? 'bg-[#C97A7E] text-white shadow-xs'
                    : 'text-[#635354] hover:text-[#2D2424]'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Scan QRIS</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePaymentMethod('bank')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activePaymentMethod === 'bank'
                    ? 'bg-[#C97A7E] text-white shadow-xs'
                    : 'text-[#635354] hover:text-[#2D2424]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Transfer Bank</span>
              </button>
            </div>

            {/* TAB 1: QRIS View */}
            {activePaymentMethod === 'qris' && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                <div className="flex flex-col items-center justify-center p-3 bg-[#FDFBF7] rounded-2xl border border-[#EBDCD5] space-y-2">
                  <div
                    onClick={() => setShowQrisModal(true)}
                    className="relative w-52 h-52 bg-white p-2.5 rounded-2xl border border-[#EBDCD5] shadow-sm cursor-pointer group overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrisUrl}
                      alt="QRIS Grisella Makeup"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span>Perbesar</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="font-bold text-xs text-[#2D2424] block">
                      {settings.qris_merchant_name || 'GRISELLA MAKEUP'}
                    </span>
                    <span className="text-[10px] text-[#9C8E8F] font-mono">
                      NMID: {settings.qris_nmid || 'ID102034091283'}
                    </span>
                  </div>

                  {/* QRIS Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowQrisModal(true)}
                      className="py-1.5 px-3 rounded-xl bg-white border border-[#EBDCD5] hover:border-[#C97A7E] text-xs font-semibold text-[#2D2424] flex items-center gap-1 transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-[#C97A7E]" />
                      <span>Perbesar Barcode</span>
                    </button>
                    <a
                      href={qrisUrl}
                      download="QRIS-Grisella-Makeup.png"
                      className="py-1.5 px-3 rounded-xl bg-white border border-[#EBDCD5] hover:border-[#C97A7E] text-xs font-semibold text-[#2D2424] flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C97A7E]" />
                      <span>Unduh QR</span>
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-[#FAEDF0]/50 rounded-2xl border border-[#F1DADF] text-[11px] text-[#635354] space-y-1">
                  <span className="font-bold text-[#8C4247] block">Langkah Pembayaran:</span>
                  <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                    <li>Buka aplikasi m-Banking (BCA, Mandiri, BRImo, BNI) atau GoPay, OVO, ShopeePay, Dana.</li>
                    <li>Pilih menu <strong>Scan QR / QRIS</strong> dan arahkan ke barcode di atas.</li>
                    <li>Masukkan nominal DP: <strong>{formatRupiah(booking.dp_amount)}</strong>.</li>
                    <li>Selesaikan pembayaran lalu simpan screenshot struk bukti transfer.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB 2: Transfer Bank View */}
            {activePaymentMethod === 'bank' && (
              <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                <span className="text-[11px] text-[#635354] block">
                  Silakan transfer DP ke salah satu nomor rekening resmi MUA berikut:
                </span>

                {bankAccounts.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#2D2424]">BCA</span>
                      <button
                        onClick={() => copyBankAccount('default-bca', '8735091234')}
                        className="text-[11px] font-semibold text-[#8C4247] bg-[#FAEDF0] px-2.5 py-1 rounded-lg flex items-center gap-1"
                      >
                        {copiedBankId === 'default-bca' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedBankId === 'default-bca' ? 'Tersalin!' : 'Salin'}</span>
                      </button>
                    </div>
                    <span className="font-mono text-base font-bold text-[#2D2424] block">8735091234</span>
                    <span className="text-[11px] text-[#635354] block">a.n. GRISELLA PUTRI</span>
                  </div>
                ) : (
                  bankAccounts.map((acc) => {
                    const isCopied = copiedBankId === acc.id;
                    return (
                      <div
                        key={acc.id}
                        className="p-3.5 rounded-2xl border border-[#EBDCD5] hover:border-[#C97A7E] bg-[#FDFBF7] transition-all text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#2D2424] bg-white border border-[#EBDCD5] px-2.5 py-0.5 rounded-md">
                            {acc.bank_name}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyBankAccount(acc.id, acc.account_number)}
                            className="text-[11px] font-semibold text-[#8C4247] bg-[#FAEDF0] hover:bg-[#F5DAE0] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Tersalin!' : 'Salin No Rekening'}</span>
                          </button>
                        </div>
                        <span className="font-mono text-sm font-bold text-[#2D2424] block tracking-wide">
                          {acc.account_number}
                        </span>
                        <span className="text-[11px] text-[#635354] block">
                          a.n. <strong>{acc.account_name}</strong>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* FORM UPLOAD BUKTI TRANSFER DP */}
            <div className="pt-3 border-t border-[#F1DADF] space-y-3">
              <div className="flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#C97A7E]" />
                <h4 className="font-bold text-xs text-[#2D2424]">Konfirmasi Pembayaran DP</h4>
              </div>

              <form onSubmit={handleSubmitProof} className="space-y-3 text-xs">
                {/* File Upload Selector */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleSelectReceiptFile}
                    className="hidden"
                  />

                  {receiptPreview ? (
                    <div className="relative p-3 bg-[#FDFBF7] border-2 border-[#C97A7E] rounded-2xl flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptPreview}
                        alt="Bukti Transfer Preview"
                        className="w-16 h-16 object-cover rounded-xl border border-[#EBDCD5]"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-[#2D2424] block truncate">
                          {receiptFile?.name}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          Foto siap dikirim ✓
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview(null);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-[#C97A7E]/60 hover:border-[#C97A7E] bg-[#FAEDF0]/40 hover:bg-[#FAEDF0]/70 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-[#C97A7E]" />
                      <span className="font-semibold text-xs text-[#8C4247]">
                        Upload Bukti Transfer DP (Foto / Screenshot)
                      </span>
                      <span className="text-[10px] text-[#9C8E8F]">
                        Klik di sini untuk memilih berkas dari HP atau komputer
                      </span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1 text-[#2D2424]">Nama Pengirim</label>
                    <input
                      type="text"
                      placeholder={booking.client?.name || 'Nama pemilik rekening'}
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[#2D2424]">Bank Pengirim</label>
                    <input
                      type="text"
                      placeholder="Cth: BCA / Mandiri / GoPay"
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!receiptFile || isSubmittingProof}
                  className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition-all ${
                    receiptFile && !isSubmittingProof
                      ? 'bg-[#C97A7E] hover:bg-[#B5676B] text-white cursor-pointer active:scale-95'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingProof ? 'Mengirim Bukti...' : 'Kirim Bukti Pembayaran DP'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Detail Reservasi Card */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-3.5">
          <h3 className="font-serif font-bold text-sm text-[#2D2424] pb-2 border-b border-[#F1DADF]">
            Detail Reservasi
          </h3>

          <div className="space-y-2.5 text-xs text-[#2D2424]">
            <div className="flex justify-between">
              <span className="text-[#635354]">Nama Pemesan</span>
              <span className="font-semibold">{booking.client?.name || '-'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#635354]">Layanan Makeup</span>
              <span className="font-semibold">{booking.makeup_type}</span>
            </div>

            {booking.custom_request && (
              <div className="p-2.5 bg-[#FAEDF0]/50 rounded-xl text-[11px] text-[#635354]">
                <span className="font-semibold text-[#8C4247] block mb-0.5">Catatan Khusus:</span>
                &ldquo;{booking.custom_request}&rdquo;
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[#635354] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span>Tanggal</span>
              </span>
              <span className="font-semibold">
                {formatWIBDate(booking.start_at, 'dd MMMM yyyy')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#635354] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span>Waktu Mulai</span>
              </span>
              <span className="font-semibold text-[#8C4247]">
                {formatWIBTime(booking.start_at)}
              </span>
            </div>

            <div className="pt-2 border-t border-[#F1DADF] space-y-1">
              <span className="text-[#635354] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span>Lokasi ({booking.service_location === 'studio' ? 'Studio Grisella' : 'Home Service'})</span>
              </span>
              <p className="text-[11px] text-[#635354] bg-[#FDFBF7] p-2.5 rounded-xl border border-[#EBDCD5] leading-relaxed">
                {booking.address || settings.studio_address || 'Studio Grisella Makeup'}
                {booking.address_benchmark && ` (Patokan: ${booking.address_benchmark})`}
              </p>
            </div>
          </div>

          {/* Pricing Breakdown */}
          {booking.status !== 'menunggu_konfirmasi' && (
            <div className="pt-3 border-t border-[#F1DADF] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#635354]">
                <span>Total Biaya</span>
                <span>{formatRupiah(booking.total_price)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#8C4247] text-sm pt-1">
                <span>Nominal DP ({settings.dp_percentage || '30'}%)</span>
                <span>{formatRupiah(booking.dp_amount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#9C8E8F]">
                <span>Sisa Pelunasan di Hari H</span>
                <span>{formatRupiah(booking.total_price - booking.dp_amount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Direct Assistance */}
        <div className="pt-1">
          <a
            href={getWaLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-white border border-[#EBDCD5] hover:border-[#25D366] text-[#2D2424] font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>Hubungi MUA via WhatsApp</span>
          </a>
        </div>
      </div>

      {/* QRIS ZOOM MODAL */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowQrisModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#FAEDF0] text-[#635354] hover:bg-[#F5DAE0]"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="font-serif font-bold text-base text-[#2D2424] block">
                QRIS {settings.qris_merchant_name || 'GRISELLA MAKEUP'}
              </span>
              <span className="text-[11px] text-[#635354]">
                Scan melalui m-Banking atau e-Wallet apapun
              </span>
            </div>

            <div className="w-64 h-64 mx-auto bg-white p-2 rounded-2xl border-2 border-[#C97A7E] shadow-sm flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrisUrl}
                alt="QRIS Fullscreen"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#EBDCD5] text-xs">
              <span className="text-[#635354] block">Nominal DP yang harus dibayar:</span>
              <strong className="text-base text-[#8C4247]">{formatRupiah(booking.dp_amount)}</strong>
            </div>

            <button
              onClick={() => setShowQrisModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#C97A7E] text-white text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
