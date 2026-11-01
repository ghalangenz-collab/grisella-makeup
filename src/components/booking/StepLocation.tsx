'use client';

import { MapPin, Home, Building2, Car } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface TransportZone {
  zone: string;
  fee: number;
}

interface StepLocationProps {
  location: 'studio' | 'home';
  address: string;
  addressBenchmark: string;
  studioAddress: string;
  transportZones: TransportZone[];
  selectedZone: string;
  transportFee: number;
  onLocationChange: (loc: 'studio' | 'home') => void;
  onAddressChange: (val: string) => void;
  onBenchmarkChange: (val: string) => void;
  onZoneSelect: (zone: TransportZone) => void;
}

export default function StepLocation({
  location,
  address,
  addressBenchmark,
  studioAddress,
  transportZones,
  selectedZone,
  transportFee,
  onLocationChange,
  onAddressChange,
  onBenchmarkChange,
  onZoneSelect,
}: StepLocationProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-serif font-bold text-[#2D2424]">Pilih Lokasi Rias</h2>
        <p className="text-xs text-[#635354]">
          Pilih apakah kamu ingin datang ke studio atau tim MUA datang ke lokasimu.
        </p>
      </div>

      {/* Pilihan Kartu Lokasi */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => onLocationChange('studio')}
          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
            location === 'studio'
              ? 'border-[#C97A7E] bg-[#FAEDF0]/50 shadow-xs'
              : 'border-[#EBDCD5] bg-white hover:border-[#D4788C]/30'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${location === 'studio' ? 'bg-[#FAEDF0] text-[#C97A7E]' : 'bg-[#FDFBF7] text-[#635354]'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-xs text-[#2D2424] block">Datang ke Studio</span>
            <span className="text-[10px] text-[#25D366] font-medium block mt-0.5">Gratis Ongkir</span>
          </div>
        </div>

        <div
          onClick={() => onLocationChange('home')}
          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
            location === 'home'
              ? 'border-[#C97A7E] bg-[#FAEDF0]/50 shadow-xs'
              : 'border-[#EBDCD5] bg-white hover:border-[#D4788C]/30'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${location === 'home' ? 'bg-[#FAEDF0] text-[#C97A7E]' : 'bg-[#FDFBF7] text-[#635354]'}`}>
            <Home className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-xs text-[#2D2424] block">Home Service</span>
            <span className="text-[10px] text-[#C97A7E] font-medium block mt-0.5">MUA ke Lokasimu</span>
          </div>
        </div>
      </div>

      {/* Konten Detail Lokasi */}
      {location === 'studio' ? (
        <div className="p-4 bg-white border border-[#EBDCD5] rounded-2xl space-y-2">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#C97A7E] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-[#2D2424] block">Alamat Studio Grisella</span>
              <p className="text-xs text-[#635354] leading-relaxed mt-0.5">{studioAddress}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-[#F1DADF] flex items-center justify-between text-[11px] text-[#635354]">
            <span>Biaya Transportasi MUA</span>
            <span className="font-bold text-[#25D366]">Rp 0 (Bebas Biaya)</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-300">
          {/* Zona Biaya Transport */}
          <div className="p-3.5 bg-white border border-[#EBDCD5] rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D2424]">
              <Car className="w-4 h-4 text-[#C97A7E]" />
              <span>Pilih Jarak / Area Lokasi</span>
            </div>
            <div className="space-y-1.5">
              {transportZones.map((z, idx) => {
                const isSelected = selectedZone === z.zone;
                return (
                  <label
                    key={idx}
                    onClick={() => onZoneSelect(z)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#C97A7E] bg-[#FAEDF0]/50 font-medium'
                        : 'border-[#EBDCD5] hover:bg-[#FDFBF7]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="transportZone"
                        checked={isSelected}
                        onChange={() => onZoneSelect(z)}
                        className="accent-[#C97A7E]"
                      />
                      <span className="text-[#2D2424]">{z.zone}</span>
                    </div>
                    <span className="font-semibold text-[#C97A7E]">{formatRupiah(z.fee)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Input Alamat Lengkap & Patokan */}
          <div className="p-3.5 bg-white border border-[#EBDCD5] rounded-2xl space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#2D2424] mb-1">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW, nama perumahan/apartemen & no. unit..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2424] mb-1">
                Patokan Lokasi (Opsional)
              </label>
              <input
                type="text"
                value={addressBenchmark}
                onChange={(e) => onBenchmarkChange(e.target.value)}
                placeholder="Cth: Pagar hitam depan masjid / dekat minimarket..."
                className="w-full text-xs p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
