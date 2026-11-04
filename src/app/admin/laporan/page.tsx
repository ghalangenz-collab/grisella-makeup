'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Award,
  Calendar,
  CheckCircle2,
  FileDown,
  Printer,
  Sparkles,
  Search,
  Filter,
  CreditCard,
  Building2,
  Home,
} from 'lucide-react';
import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { getAdminCache, setAdminCache } from '@/lib/admin-cache';

export const dynamic = 'force-dynamic';

interface Transaction {
  id: string;
  token: string;
  date: string;
  clientName: string;
  clientPhone: string;
  makeupType: string;
  location: string;
  status: string;
  totalPrice: number;
  dpAmount: number;
  isDpPaid: boolean;
  paidDpAt: string | null;
  settlementAmount: number;
  isSettled: boolean;
  paidSettlementAt: string | null;
  settlementMethod: string | null;
}

interface ReportData {
  summary: {
    totalRevenue: number;
    totalDpCollected: number;
    totalSettlementCollected: number;
    totalBookings: number;
    completedCount: number;
    confirmedCount: number;
    pendingVerificationCount: number;
    averageOrderValue: number;
  };
  transactions: Transaction[];
  popularServices: { name: string; count: number; totalRevenue: number }[];
  monthlyTrend: { month: string; revenue: number }[];
}

export default function AdminLaporanPage() {
  const [reportData, setReportData] = useState<ReportData>(() => {
    return (
      getAdminCache<ReportData>('reports') || {
        summary: {
          totalRevenue: 4850000,
          totalDpCollected: 1455000,
          totalSettlementCollected: 3395000,
          totalBookings: 8,
          completedCount: 6,
          confirmedCount: 2,
          pendingVerificationCount: 0,
          averageOrderValue: 606250,
        },
        transactions: [],
        popularServices: [
          { name: 'Makeup Wisuda / Graduation', count: 4, totalRevenue: 1800000 },
          { name: 'Bridesmaid Makeup', count: 3, totalRevenue: 1350000 },
          { name: 'Wedding Makeup (Akad / Resepsi)', count: 1, totalRevenue: 1700000 },
        ],
        monthlyTrend: [
          { month: 'Agu 26', revenue: 2900000 },
          { month: 'Sep 26', revenue: 3800000 },
          { month: 'Okt 26', revenue: 4850000 },
        ],
      }
    );
  });

  const [periodFilter, setPeriodFilter] = useState<'semua' | 'bulan_ini' | 'bulan_lalu'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports', { cache: 'no-store' });
      const data = await res.json();
      if (data.report) {
        setReportData(data.report);
        setAdminCache('reports', data.report);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter transaksi berdasarkan periode & pencarian
  const filteredTransactions = useMemo(() => {
    const list = reportData.transactions || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return list.filter((tx) => {
      const txDate = new Date(tx.date);
      if (periodFilter === 'bulan_ini') {
        if (txDate.getMonth() !== currentMonth || txDate.getFullYear() !== currentYear) {
          return false;
        }
      } else if (periodFilter === 'bulan_lalu') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (txDate.getMonth() !== lastMonth || txDate.getFullYear() !== lastYear) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.clientName.toLowerCase().includes(q) ||
          tx.makeupType.toLowerCase().includes(q) ||
          tx.token.toLowerCase().includes(q) ||
          tx.clientPhone.includes(q)
        );
      }

      return true;
    });
  }, [reportData.transactions, periodFilter, searchQuery]);

  // Fungsi Cetak / Download PDF
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* CSS KHUSUS PRINT PDF */}
      <style jsx global>{`
        @media print {
          /* Sembunyikan elemen navigasi dan tombol non-cetak */
          aside,
          header,
          nav,
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
            color: #111 !important;
            font-size: 11pt !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Tampilkan container laporan secara penuh */
          .print-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }

          .print-header {
            display: block !important;
            border-bottom: 2px solid #333;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }

          .print-card {
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            background: white !important;
            page-break-inside: avoid;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            font-size: 9pt !important;
          }

          th {
            background-color: #f5f5f5 !important;
            color: #000 !important;
            font-weight: bold !important;
          }
        }
      `}</style>

      {/* HEADER UTAMA & TOMBOL UNDUH PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAEDF0] border border-[#F1DADF] text-[#8C4247] text-[11px] font-semibold mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#C97A7E]" />
            <span>Manajemen Finansial & Pendapatan MUA</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Laporan Keuangan Resmi</h1>
          <p className="text-xs text-[#635354] mt-0.5">
            Rekap omset rias, total DP diterima, pelunasan, dan riwayat transaksi buku besar.
          </p>
        </div>

        {/* Tombol Aksi Unduh PDF */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            title="Download atau Cetak Laporan Keuangan dalam Format PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>Unduh Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* KOP LAPORAN RESMI (Tampil saat Cetak PDF) */}
      <div className="hidden print:block print-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-serif text-2xl font-bold text-black uppercase tracking-wider">
              GRISELLA MAKEUP ARTIST
            </h1>
            <p className="text-xs text-zinc-600 mt-1">
              Professional Solo MUA &bull; Jl. Gunur No. 368 &bull; WhatsApp: +62 851-5684-7921
            </p>
            <p className="text-xs text-zinc-600">
              Sistem Pembukuan & Manajemen Reservasi Resmi
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold block">LAPORAN KEUANGAN & OMSET</span>
            <span className="text-xs text-zinc-600">
              Dicetak pada: {formatWIBDate(new Date().toISOString(), 'dd MMMM yyyy, HH:mm')} WIB
            </span>
          </div>
        </div>
      </div>

      {/* TOP STAT CARDS (4 PILAR KEUANGAN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-1.5 print-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635354]">Total Pendapatan (Omset)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 no-print">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {formatRupiah(reportData.summary.totalRevenue)}
          </div>
          <span className="text-[10px] text-[#635354] block">
            DP Terverifikasi + Pelunasan Selesai
          </span>
        </div>

        {/* Total DP Diterima */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-1.5 print-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635354]">Total DP Terkumpul</span>
            <div className="p-2 rounded-xl bg-[#FAEDF0] text-[#C97A7E] no-print">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#8C4247]">
            {formatRupiah(reportData.summary.totalDpCollected)}
          </div>
          <span className="text-[10px] text-[#635354] block">Uang muka booking masuk</span>
        </div>

        {/* Total Pelunasan Diterima */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-1.5 print-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635354]">Total Pelunasan</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 no-print">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {formatRupiah(reportData.summary.totalSettlementCollected)}
          </div>
          <span className="text-[10px] text-[#635354] block">Pelunasan di hari acara</span>
        </div>

        {/* Sesi Makeup Selesai */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-1.5 print-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635354]">Sesi Makeup Selesai</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 no-print">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {reportData.summary.completedCount} Job Selesai
          </div>
          <span className="text-[10px] text-[#25D366] font-medium block">
            Rata-rata: {formatRupiah(reportData.summary.averageOrderValue)} / klien
          </span>
        </div>
      </div>

      {/* FILTER & PENCARIAN TRANSAKSI (HANYA LAYAR) */}
      <div className="bg-white border border-[#EBDCD5] rounded-3xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        {/* Periode Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-semibold text-[#635354] mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Periode:</span>
          </span>
          <button
            type="button"
            onClick={() => setPeriodFilter('semua')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              periodFilter === 'semua'
                ? 'bg-[#C97A7E] text-white shadow-xs'
                : 'bg-[#FDFBF7] text-[#635354] hover:bg-[#FAEDF0]'
            }`}
          >
            Semua Waktu
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('bulan_ini')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              periodFilter === 'bulan_ini'
                ? 'bg-[#C97A7E] text-white shadow-xs'
                : 'bg-[#FDFBF7] text-[#635354] hover:bg-[#FAEDF0]'
            }`}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('bulan_lalu')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              periodFilter === 'bulan_lalu'
                ? 'bg-[#C97A7E] text-white shadow-xs'
                : 'bg-[#FDFBF7] text-[#635354] hover:bg-[#FAEDF0]'
            }`}
          >
            Bulan Lalu
          </button>
        </div>

        {/* Input Cari */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9C8E8F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama klien / layanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-2xl bg-[#FDFBF7] border border-[#EBDCD5] text-xs text-[#2D2424] focus:outline-none focus:border-[#C97A7E] w-full md:w-60"
          />
        </div>
      </div>

      {/* TABEL RINCIAN RIWAYAT TRANSAKSI KEUANGAN */}
      <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4 print-card">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C97A7E]" />
            <h2 className="font-serif font-bold text-sm text-[#2D2424]">
              Rincian Transaksi & Pembayaran ({filteredTransactions.length} Transaksi)
            </h2>
          </div>
          <span className="text-[11px] text-[#9C8E8F]">
            Format cetak standar akuntansi pembukuan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EBDCD5] bg-[#FDFBF7] text-[#635354]">
                <th className="py-3 px-3 font-semibold">Tanggal & Jam</th>
                <th className="py-3 px-3 font-semibold">Nama Klien</th>
                <th className="py-3 px-3 font-semibold">Layanan Rias</th>
                <th className="py-3 px-3 font-semibold">Lokasi</th>
                <th className="py-3 px-3 font-semibold">Total Tarif</th>
                <th className="py-3 px-3 font-semibold">DP Masuk</th>
                <th className="py-3 px-3 font-semibold">Pelunasan</th>
                <th className="py-3 px-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1DADF]/60">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FDFBF7]/60 transition-colors">
                    <td className="py-3 px-3 text-[11px] text-[#635354] whitespace-nowrap">
                      {formatWIBDate(tx.date, 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#2D2424]">
                      <div>{tx.clientName}</div>
                      <span className="text-[10px] text-[#9C8E8F]">{tx.clientPhone}</span>
                    </td>
                    <td className="py-3 px-3 text-[#2D2424]">
                      {tx.makeupType}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-[#635354] whitespace-nowrap">
                      {tx.location}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#2D2424]">
                      {formatRupiah(tx.totalPrice)}
                    </td>
                    <td className="py-3 px-3">
                      {tx.isDpPaid ? (
                        <span className="font-semibold text-emerald-700">
                          {formatRupiah(tx.dpAmount)}
                        </span>
                      ) : (
                        <span className="text-[#9C8E8F] text-[10px]">Belum DP</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {tx.isSettled ? (
                        <span className="font-semibold text-blue-700">
                          {formatRupiah(tx.settlementAmount)} ({tx.settlementMethod || 'TF'})
                        </span>
                      ) : (
                        <span className="text-[#9C8E8F] text-[10px]">Sisa {formatRupiah(tx.totalPrice - tx.dpAmount)}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {tx.status === 'selesai' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          LUNAS SELESAI
                        </span>
                      )}
                      {tx.status === 'dikonfirmasi' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                          DP TERKONFIRMASI
                        </span>
                      )}
                      {tx.status === 'menunggu_verifikasi' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900">
                          VERIFIKASI DP
                        </span>
                      )}
                      {tx.status === 'menunggu_pembayaran' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                          MENUNGGU DP
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#9C8E8F]">
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DUA KOLOM: LAYANAN TERLARIS & TREN OMSET */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Layanan Terlaris */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4 print-card">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1DADF]">
            <Award className="w-4 h-4 text-[#C97A7E]" />
            <h2 className="font-serif font-bold text-sm text-[#2D2424]">Kontribusi Layanan Terlaris</h2>
          </div>

          <div className="space-y-3">
            {reportData.popularServices.map((srv, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[#2D2424] block">{srv.name}</span>
                  <span className="text-[11px] text-[#635354]">{srv.count} kali reservasi</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs text-[#8C4247] block">
                    {formatRupiah(srv.totalRevenue)}
                  </span>
                  <span className="text-[10px] text-[#9C8E8F]">Total omset</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tren Pertumbuhan Bulanan */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4 print-card">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1DADF]">
            <TrendingUp className="w-4 h-4 text-[#C97A7E]" />
            <h2 className="font-serif font-bold text-sm text-[#2D2424]">Tren Omset Bulanan</h2>
          </div>

          <div className="space-y-3 pt-2">
            {reportData.monthlyTrend.map((m, idx) => {
              const maxRev = Math.max(...reportData.monthlyTrend.map((t) => t.revenue)) || 1;
              const pct = (m.revenue / maxRev) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#2D2424]">{m.month}</span>
                    <span className="text-[#8C4247]">{formatRupiah(m.revenue)}</span>
                  </div>
                  <div className="w-full h-3 bg-[#F7F2EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C97A7E] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TANDA TANGAN PEMILIK (KHUSUS CETAK PDF) */}
      <div className="hidden print:flex justify-end pt-12 pr-6">
        <div className="text-center space-y-16">
          <div>
            <p className="text-xs text-zinc-600">Disahkan oleh Pemilik Usaha,</p>
            <p className="text-xs font-bold text-black uppercase mt-1">Grisella Makeup Studio</p>
          </div>
          <div>
            <p className="text-xs font-bold underline text-black">Grisella</p>
            <p className="text-[10px] text-zinc-500">Pemilik & Lead Makeup Artist</p>
          </div>
        </div>
      </div>
    </div>
  );
}
