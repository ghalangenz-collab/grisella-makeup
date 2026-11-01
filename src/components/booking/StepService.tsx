'use client';

import { Service } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import { Clock, CheckCircle2, Sparkles, HeartHandshake, GraduationCap, Palette } from 'lucide-react';

interface StepServiceProps {
  services: Service[];
  selectedServiceId: string;
  makeupType: string;
  customRequest: string;
  onSelectService: (service: Service) => void;
  onCustomRequestChange: (val: string) => void;
}

export default function StepService({
  services,
  selectedServiceId,
  makeupType,
  customRequest,
  onSelectService,
  onCustomRequestChange,
}: StepServiceProps) {
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wedding') || lower.includes('pengantin') || lower.includes('akad')) {
      return <HeartHandshake className="w-5 h-5 text-[#C97A7E]" />;
    }
    if (lower.includes('wisuda') || lower.includes('graduation')) {
      return <GraduationCap className="w-5 h-5 text-[#C97A7E]" />;
    }
    if (lower.includes('bridesmaid') || lower.includes('glam')) {
      return <Sparkles className="w-5 h-5 text-[#C97A7E]" />;
    }
    return <Palette className="w-5 h-5 text-[#C97A7E]" />;
  };

  const isLainnya = makeupType.toLowerCase().includes('lainnya') || selectedServiceId === '44444444-4444-4444-4444-444444444444';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-serif font-bold text-[#2D2424]">Pilih Paket Layanan</h2>
        <p className="text-xs text-[#635354] mt-0.5">
          Pilih kategori tata rias yang kamu inginkan untuk momen istimewamu.
        </p>
      </div>

      <div className="space-y-3">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;
          const isCustom = service.name.toLowerCase().includes('lainnya') || service.price === 0;

          return (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`relative p-4 rounded-3xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#C97A7E] bg-[#FAEDF0]/50 shadow-md ring-1 ring-[#C97A7E]/30'
                  : 'border-[#EBDCD5] bg-white hover:border-[#C97A7E]/40 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#FAEDF0] border border-[#F1DADF]'
                        : 'bg-[#FDFBF7] border border-[#EBDCD5]'
                    }`}
                  >
                    {getIcon(service.name)}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#2D2424]">{service.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#635354] bg-[#F7F2EB] px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-[#C97A7E]" />
                        <span>{service.duration_minutes} menit</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {isCustom ? (
                    <span className="text-[11px] font-bold text-[#8C4247] bg-[#FAEDF0] px-2.5 py-1 rounded-full border border-[#F1DADF]">
                      Tinjau Admin
                    </span>
                  ) : (
                    <span className="font-serif font-bold text-base text-[#8C4247] block">
                      {formatRupiah(service.price)}
                    </span>
                  )}
                </div>
              </div>

              {service.description && (
                <p className="text-xs text-[#635354] mt-2.5 leading-relaxed pl-14">
                  {service.description}
                </p>
              )}

              {isSelected && (
                <div className="absolute top-3.5 right-3.5 text-[#C97A7E]">
                  <CheckCircle2 className="w-5 h-5 fill-[#FAEDF0]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Kolom Wajib jika Memilih Lainnya */}
      {isLainnya && (
        <div className="p-4 bg-[#FAEDF0]/70 border border-[#F1DADF] rounded-3xl space-y-2 mt-4 animate-in fade-in duration-300">
          <label className="block text-xs font-bold text-[#8C4247]">
            Makeup apa yang kamu inginkan? <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={customRequest}
            onChange={(e) => onCustomRequestChange(e.target.value)}
            placeholder="Cth: Makeup photoshoot prewedding outdoor adat Bali, butuh 2 look berbeda..."
            rows={3}
            className="w-full text-xs p-3 rounded-2xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E] shadow-xs"
          />
          <p className="text-[11px] text-[#635354] italic">
            * Layanan custom akan berstatus <strong>Menunggu Konfirmasi Admin</strong>. MUA Grisella akan mengonfirmasi durasi & tarif terbaik, lalu link pembayaran DP akan diterbitkan untuk kamu.
          </p>
        </div>
      )}
    </div>
  );
}
