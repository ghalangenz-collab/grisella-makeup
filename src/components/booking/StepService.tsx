'use client';

import { useState, useMemo, useEffect } from 'react';
import { Service } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
  GraduationCap,
  Palette,
  ChevronRight,
  Info,
} from 'lucide-react';

interface StepServiceProps {
  services: Service[];
  selectedServiceId: string;
  makeupType: string;
  customRequest: string;
  onSelectService: (service: Service) => void;
  onCustomRequestChange: (val: string) => void;
}

type MainCategoryKey = 'Bridesmaid' | 'Wedding' | 'Graduation' | 'Lainnya';

const CATEGORIES: {
  key: MainCategoryKey;
  label: string;
  shortDesc: string;
  icon: typeof Sparkles;
  defaultImage: string;
}[] = [
  {
    key: 'Bridesmaid',
    label: 'Bridesmaid',
    shortDesc: 'Look flawless natural untuk pendamping pengantin',
    icon: Sparkles,
    defaultImage:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'Wedding',
    label: 'Wedding',
    shortDesc: 'Rias pengantin akad & resepsi tahan 12 jam',
    icon: HeartHandshake,
    defaultImage:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'Graduation',
    label: 'Wisuda / Grad',
    shortDesc: 'Fresh glowing look wisuda tahan seharian',
    icon: GraduationCap,
    defaultImage:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'Lainnya',
    label: 'Lainnya / Custom',
    shortDesc: 'Photoshoot, sangjit, party, & custom event',
    icon: Palette,
    defaultImage:
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
  },
];

export default function StepService({
  services,
  selectedServiceId,
  makeupType,
  customRequest,
  onSelectService,
  onCustomRequestChange,
}: StepServiceProps) {
  // Tentukan kategori aktif awal dari service yang sedang terpilih
  const initialCategory = useMemo<MainCategoryKey | null>(() => {
    const selected = services.find((s) => s.id === selectedServiceId);
    if (selected) {
      if (selected.category) return selected.category as MainCategoryKey;
      const lower = selected.name.toLowerCase();
      if (lower.includes('wedding') || lower.includes('pengantin') || lower.includes('akad'))
        return 'Wedding';
      if (lower.includes('wisuda') || lower.includes('graduation')) return 'Graduation';
      if (lower.includes('bridesmaid')) return 'Bridesmaid';
      return 'Lainnya';
    }
    return null;
  }, [services, selectedServiceId]);

  const [activeCategory, setActiveCategory] = useState<MainCategoryKey | null>(initialCategory);

  // Filter paket layanan yang masuk ke dalam kategori yang sedang di-klik
  const categoryServices = useMemo(() => {
    if (!activeCategory) return [];
    return services.filter((s) => {
      if (s.category) {
        return s.category.toLowerCase() === activeCategory.toLowerCase();
      }
      const lower = s.name.toLowerCase();
      if (activeCategory === 'Wedding') {
        return lower.includes('wedding') || lower.includes('pengantin') || lower.includes('akad');
      }
      if (activeCategory === 'Graduation') {
        return lower.includes('wisuda') || lower.includes('graduation');
      }
      if (activeCategory === 'Bridesmaid') {
        return lower.includes('bridesmaid');
      }
      return (
        lower.includes('lainnya') ||
        lower.includes('photo') ||
        lower.includes('party') ||
        lower.includes('sangjit') ||
        s.price === 0
      );
    });
  }, [services, activeCategory]);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const isCustom =
    selectedService?.price === 0 ||
    selectedService?.name.toLowerCase().includes('lainnya') ||
    makeupType.toLowerCase().includes('lainnya');

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-serif font-bold text-[#2D2424]">Pilih Kategori & Paket Rias</h2>
        <p className="text-xs text-[#635354] mt-0.5">
          Klik salah satu kategori utama untuk melihat pilihan paket, foto hasil rias, dan tarif harga.
        </p>
      </div>

      {/* 1. TOMBOL KLIK KATEGORI UTAMA (Bridesmaid, Wedding, Wisuda, Lainnya) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer relative group ${
                isActive
                  ? 'border-[#C97A7E] bg-[#FAEDF0] shadow-sm ring-1 ring-[#C97A7E]'
                  : 'border-[#EBDCD5] bg-white hover:border-[#D4788C]/40 hover:bg-[#FDFBF7]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  isActive
                    ? 'bg-[#C97A7E] text-white'
                    : 'bg-[#FDFBF7] text-[#8C4247] border border-[#F1DADF]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isActive ? 'text-[#8C4247]' : 'text-[#2D2424]'}`}>
                  {cat.label}
                </span>
                <span className="text-[10px] text-[#8A797A] line-clamp-1 block mt-0.5 font-normal">
                  {cat.shortDesc}
                </span>
              </div>
              {isActive && (
                <div className="w-2 h-2 rounded-full bg-[#C97A7E] absolute bottom-1 left-1/2 -translate-x-1/2" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. DAFTAR PILIHAN PAKET & FOTO-FOTO DARI KATEGORI YANG DIKLIK */}
      {!activeCategory ? (
        <div className="p-8 text-center bg-white border-2 border-dashed border-[#F1DADF] rounded-3xl space-y-2 animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-[#FAEDF0] text-[#C97A7E] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-sm text-[#2D2424]">
            Silakan Klik Salah Satu Kategori di Atas
          </h3>
          <p className="text-xs text-[#635354] max-w-xs mx-auto">
            Ketuk Bridesmaid, Wedding, Wisuda, atau Lainnya untuk membuka pilihan paket, foto hasil rias, dan rincian harganya.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#8C4247] flex items-center gap-1.5 uppercase tracking-wider">
              <span>Pilihan Paket {activeCategory}</span>
              <span className="text-[10px] font-normal text-[#9C8E8F] normal-case tracking-normal">
                ({categoryServices.length} pilihan)
              </span>
            </span>
            <span className="text-[11px] text-[#9C8E8F]">Ketuk untuk memilih</span>
          </div>

          {categoryServices.length === 0 ? (
            <div className="p-6 text-center bg-white border border-[#EBDCD5] rounded-3xl text-xs text-[#9C8E8F]">
              Belum ada paket aktif pada kategori ini.
            </div>
          ) : (
          categoryServices.map((service) => {
            const isSelected = selectedServiceId === service.id;
            const isZeroPrice = service.price === 0;
            const photoUrl =
              service.image_url ||
              CATEGORIES.find((c) => c.key === activeCategory)?.defaultImage ||
              'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80';

            return (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className={`relative overflow-hidden rounded-3xl border-2 transition-all cursor-pointer p-3.5 sm:p-4 bg-white ${
                  isSelected
                    ? 'border-[#C97A7E] bg-[#FAEDF0]/50 shadow-md ring-1 ring-[#C97A7E]/40'
                    : 'border-[#EBDCD5] hover:border-[#C97A7E]/50 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Foto Hasil Rias Layanan */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-[#F1DADF] bg-[#FAEDF0]">
                    <img
                      src={photoUrl}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#C97A7E]/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>

                  {/* Rincian Paket */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif font-bold text-sm text-[#2D2424] leading-snug">
                        {service.name}
                      </h3>
                      {isSelected && (
                        <span className="shrink-0 text-[10px] font-bold text-[#8C4247] bg-[#FAEDF0] px-2 py-0.5 rounded-full border border-[#F1DADF]">
                          Dipilih ✓
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#635354] bg-[#F7F2EB] px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-[#C97A7E]" />
                        <span>{service.duration_minutes} menit</span>
                      </span>

                      {/* Tampilan Harga */}
                      {isZeroPrice ? (
                        <span className="text-[11px] font-bold text-[#8C4247] bg-[#FAEDF0] px-2 py-0.5 rounded-md border border-[#F1DADF]">
                          Tinjau Admin
                        </span>
                      ) : (
                        <span className="font-serif font-bold text-sm text-[#8C4247]">
                          {formatRupiah(service.price)}
                        </span>
                      )}
                    </div>

                    {service.description && (
                      <p className="text-xs text-[#635354] mt-2 leading-relaxed line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      {/* 3. FORM KHUSUS JIKA CUSTOM REQUEST */}
      {isCustom && (
        <div className="p-4 bg-[#FAEDF0]/80 border border-[#F1DADF] rounded-3xl space-y-2 mt-4 animate-in fade-in duration-300">
          <label className="block text-xs font-bold text-[#8C4247]">
            Rincian Permintaan Makeup Khusus <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={customRequest}
            onChange={(e) => onCustomRequestChange(e.target.value)}
            placeholder="Cth: Makeup photoshoot prewedding outdoor adat Bali, butuh 2 look berbeda..."
            rows={3}
            className="w-full text-xs p-3 rounded-2xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E] shadow-xs"
          />
          <p className="text-[11px] text-[#635354] italic">
            * Layanan custom akan berstatus <strong>Menunggu Konfirmasi Admin</strong>. MUA Grisella
            akan mengonfirmasi durasi & tarif terbaik, lalu link pembayaran DP akan diterbitkan untuk
            kamu.
          </p>
        </div>
      )}
    </div>
  );
}
