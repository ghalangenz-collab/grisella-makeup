'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Award, Calendar, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function AdminLaporanPage() {
  const [reportData, setReportData] = useState<{
    monthlyTotal: number;
    completedBookingsCount: number;
    popularServices: { name: string; count: number; totalRevenue: number }[];
    monthlyTrend: { month: string; revenue: number }[];
  }>({
    monthlyTotal: 4750000,
    completedBookingsCount: 8,
    popularServices: [
      { name: 'Bridesmaid Makeup', count: 5, totalRevenue: 2250000 },
      { name: 'Wedding Makeup (Akad / Resepsi)', count: 1, totalRevenue: 2500000 },
      { name: 'Graduation / Wisuda Makeup', count: 2, totalRevenue: 800000 },
    ],
    monthlyTrend: [
      { month: 'Agu', revenue: 2800000 },
      { month: 'Sep', revenue: 3900000 },
      { month: 'Okt', revenue: 4750000 },
    ],
  });

  useEffect(() => {
    fetch('/api/admin/reports')
      .then((res) => res.json())
      .then((data) => {
        if (data.report) setReportData(data.report);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Laporan Keuangan & Performa</h1>
        <p className="text-xs text-[#635354]">
          Rekap omset rias, performa layanan terlaris, dan tren pertumbuhan bisnis Grisella Makeup.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635354]">Total Pemasukan Bulan Ini</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {formatRupiah(reportData.monthlyTotal)}
          </div>
          <span className="text-[11px] text-[#635354]">
            Dari booking status <strong>Selesai</strong>
          </span>
        </div>

        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635354]">Job Makeup Selesai</span>
            <div className="p-2.5 rounded-xl bg-[#FAEDF0] text-[#C97A7E]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#2D2424]">
            {reportData.completedBookingsCount} sesi
          </div>
          <span className="text-[11px] text-[#25D366] font-medium">Bulan berjalan</span>
        </div>

        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635354]">Rata-rata Omset / Klien</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {formatRupiah(
              reportData.completedBookingsCount > 0
                ? reportData.monthlyTotal / reportData.completedBookingsCount
                : 0
            )}
          </div>
          <span className="text-[11px] text-[#635354]">Average order value</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Layanan Terlaris */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1DADF]">
            <Award className="w-4 h-4 text-[#C97A7E]" />
            <h2 className="font-serif font-bold text-sm text-[#2D2424]">Layanan Terlaris</h2>
          </div>

          <div className="space-y-3">
            {reportData.popularServices.map((srv, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[#2D2424] block">{srv.name}</span>
                  <span className="text-[11px] text-[#635354]">{srv.count} kali dipesan</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs text-[#8C4247] block">
                    {formatRupiah(srv.totalRevenue)}
                  </span>
                  <span className="text-[10px] text-[#9C8E8F]">Kontribusi omset</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tren Pertumbuhan Bulanan */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1DADF]">
            <Calendar className="w-4 h-4 text-[#C97A7E]" />
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
    </div>
  );
}
