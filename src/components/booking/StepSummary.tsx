'use client';

import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { Calendar, Clock, MapPin, Sparkles, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';

interface StepSummaryProps {
  makeupType: string;
  customRequest?: string;
  durationMinutes: number;
  servicePrice: number;
  serviceLocation: 'studio' | 'home';
  address: string;
  addressBenchmark?: string;
  transportFee: number;
  date: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  cancellationPolicy: string;
  dpPercentage?: number;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export default function StepSummary({
  makeupType,
  customRequest,
  durationMinutes,
  servicePrice,
  serviceLocation,
  address,
  addressBenchmark,
  transportFee,
  date,
  startTime,
  clientName,
  clientPhone,
  cancellationPolicy,
  dpPercentage = 30,
  isSubmitting,
  onSubmit,
}: StepSummaryProps) {
  const isCustom = makeupType === 'Lainnya';
  const totalPrice = isCustom ? 0 : servicePrice + transportFee;
  const dpRate = (dpPercentage || 30) / 100;
  const dpAmount = isCustom ? 0 : Math.round(totalPrice * dpRate);
  const remainingAmount = isCustom ? 0 : totalPrice - dpAmount;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-serif font-bold text-[#2D2424]">Ringkasan Booking</h2>
        <p className="text-xs text-[#635354]">
          Pastikan semua rincian di bawah ini sudah sesuai sebelum melanjutkan.
        </p>
      </div>

      {/* Rincian Pesanan (Receipt Style) */}
      <div className="bg-white border border-[#EBDCD5] rounded-3xl p-4.5 space-y-4 shadow-xs">
        {/* Info Pemesan */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
          <div>
            <span className="text-[10px] text-[#9C8E8F] uppercase tracking-wider block">Pemesan</span>
            <span className="text-xs font-bold text-[#2D2424]">{clientName}</span>
          </div>
          <span className="text-xs text-[#635354] font-medium bg-[#F7F2EB] px-2.5 py-1 rounded-full">
            {clientPhone}
          </span>
        </div>

        {/* Layanan & Waktu */}
        <div className="space-y-2.5 text-xs text-[#2D2424]">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#C97A7E] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">{makeupType}</span>
              {isCustom && customRequest && (
                <p className="text-[11px] text-[#635354] italic mt-0.5 bg-[#FAEDF0]/50 p-2 rounded-lg">
                  &ldquo;{customRequest}&rdquo;
                </p>
              )}
              <span className="text-[11px] text-[#9C8E8F]">Durasi: {durationMinutes} menit</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-[#C97A7E] shrink-0" />
            <span>{date ? formatWIBDate(date, 'EEEE, dd MMMM yyyy') : '-'}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#C97A7E] shrink-0" />
            <span className="font-semibold text-[#8C4247]">{startTime} WIB</span>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#C97A7E] shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">
                {serviceLocation === 'studio' ? 'Datang ke Studio' : 'Home Service (Diantar ke Lokasi)'}
              </span>
              <p className="text-[11px] text-[#635354] leading-relaxed mt-0.5">{address}</p>
              {addressBenchmark && (
                <p className="text-[10px] text-[#9C8E8F]">Patokan: {addressBenchmark}</p>
              )}
            </div>
          </div>
        </div>

        {/* Rincian Harga & DP */}
        <div className="pt-3 border-t border-[#F1DADF] space-y-2">
          {isCustom ? (
            <div className="p-3 bg-[#FAEDF0]/60 rounded-xl text-xs text-[#8C4247] space-y-1">
              <span className="font-bold block">Status: Menunggu Konfirmasi Admin</span>
              <p className="text-[11px] text-[#635354]">
                Karena ini layanan kustom, Admin Grisella Makeup akan menghubungi dan menentukan harga serta durasi resmi terlebih dahulu.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-xs text-[#635354]">
                <span>Biaya Layanan</span>
                <span>{formatRupiah(servicePrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#635354]">
                <span>Biaya Transportasi MUA</span>
                <span>{transportFee > 0 ? formatRupiah(transportFee) : 'Rp 0'}</span>
              </div>

              <div className="flex justify-between text-xs font-semibold text-[#2D2424] pt-1 border-t border-dashed border-[#EBDCD5]">
                <span>Total Biaya</span>
                <span>{formatRupiah(totalPrice)}</span>
              </div>

              {/* DP Highlight */}
              <div className="p-3 bg-[#FAEDF0] border border-[#F1DADF] rounded-xl flex items-center justify-between text-xs mt-2">
                <div>
                  <span className="font-bold text-[#8C4247] block">Down Payment (DP {dpPercentage}%)</span>
                  <span className="text-[10px] text-[#635354]">Untuk mengunci slot jadwal</span>
                </div>
                <span className="font-bold text-base text-[#C97A7E]">{formatRupiah(dpAmount)}</span>
              </div>

              <div className="flex justify-between text-[11px] text-[#9C8E8F] px-1">
                <span>Sisa pelunasan (dibayar hari H):</span>
                <span className="font-medium text-[#635354]">{formatRupiah(remainingAmount)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Syarat & Kebijakan Pembatalan */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold block text-[11px]">Kebijakan Pembatalan</span>
          <p className="text-[10px] text-amber-800/90 leading-relaxed">{cancellationPolicy}</p>
        </div>
      </div>

      {/* Tombol Aksi */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onSubmit}
        className="w-full py-3.5 px-4 rounded-2xl bg-[#C97A7E] hover:bg-[#B5676B] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Memproses Booking...</span>
          </>
        ) : isCustom ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Kirim Permintaan Booking</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Booking & Lanjut Bayar DP ({formatRupiah(dpAmount)})</span>
          </>
        )}
      </button>
    </div>
  );
}
