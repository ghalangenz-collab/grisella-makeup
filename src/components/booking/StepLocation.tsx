'use client';

import { useState } from 'react';
import { MapPin, Home, Building2, Car, Navigation, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { formatRupiah, createGoogleMapsUrl } from '@/lib/utils';

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
  locationMapUrl?: string;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  onLocationChange: (loc: 'studio' | 'home') => void;
  onAddressChange: (val: string) => void;
  onBenchmarkChange: (val: string) => void;
  onZoneSelect: (zone: TransportZone) => void;
  onGpsChange?: (lat: number | null, lng: number | null, mapUrl: string) => void;
}

export default function StepLocation({
  location,
  address,
  addressBenchmark,
  studioAddress,
  transportZones,
  selectedZone,
  transportFee,
  locationMapUrl = '',
  gpsLatitude = null,
  gpsLongitude = null,
  onLocationChange,
  onAddressChange,
  onBenchmarkChange,
  onZoneSelect,
  onGpsChange,
}: StepLocationProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Ambil titik GPS otomatis via Geolocation API browser
  const handleDetectGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung deteksi lokasi otomatis. Silakan tempel link Google Maps.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const gmapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        if (onGpsChange) {
          onGpsChange(lat, lng, gmapsUrl);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Izin akses lokasi ditolak di browser Anda. Mohon izinkan atau tempel link Google Maps secara manual.');
        } else {
          setGpsError('Gagal mendeteksi titik GPS otomatis. Silakan tempel tautan Google Maps.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleManualMapUrlChange = (url: string) => {
    // Coba ekstrak lat & lng jika format URL mengandung q=lat,lng atau @lat,lng
    let lat: number | null = gpsLatitude;
    let lng: number | null = gpsLongitude;

    const matchQ = url.match(/[?&]q=([-0-9.]+),([-0-9.]+)/);
    if (matchQ) {
      lat = parseFloat(matchQ[1]);
      lng = parseFloat(matchQ[2]);
    } else {
      const matchAt = url.match(/@([-0-9.]+),([-0-9.]+)/);
      if (matchAt) {
        lat = parseFloat(matchAt[1]);
        lng = parseFloat(matchAt[2]);
      }
    }

    if (onGpsChange) {
      onGpsChange(lat, lng, url);
    }
  };

  const currentMapLink =
    locationMapUrl ||
    (gpsLatitude && gpsLongitude ? `https://www.google.com/maps?q=${gpsLatitude},${gpsLongitude}` : '');

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-serif font-bold text-[#2D2424]">Pilih Lokasi Rias</h2>
        <p className="text-xs text-[#635354] mt-0.5">
          Pilih apakah kamu ingin datang ke studio atau tim MUA datang ke rumah / venumu.
        </p>
      </div>

      {/* Pilihan Kartu Lokasi */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => onLocationChange('studio')}
          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
            location === 'studio'
              ? 'border-[#C97A7E] bg-[#FAEDF0]/50 shadow-xs ring-1 ring-[#C97A7E]/40'
              : 'border-[#EBDCD5] bg-white hover:border-[#D4788C]/30'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              location === 'studio' ? 'bg-[#FAEDF0] text-[#C97A7E]' : 'bg-[#FDFBF7] text-[#635354]'
            }`}
          >
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
              ? 'border-[#C97A7E] bg-[#FAEDF0]/50 shadow-xs ring-1 ring-[#C97A7E]/40'
              : 'border-[#EBDCD5] bg-white hover:border-[#D4788C]/30'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              location === 'home' ? 'bg-[#FAEDF0] text-[#C97A7E]' : 'bg-[#FDFBF7] text-[#635354]'
            }`}
          >
            <Home className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-xs text-[#2D2424] block">Home Service</span>
            <span className="text-[10px] text-[#C97A7E] font-medium block mt-0.5">MUA ke Lokasimu</span>
          </div>
        </div>
      </div>

      {/* Detail Konten Lokasi */}
      {location === 'studio' ? (
        <div className="p-4 bg-white border border-[#EBDCD5] rounded-3xl space-y-2 shadow-xs">
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
        <div className="space-y-3.5 animate-in fade-in duration-300">
          {/* Zona Biaya Transport */}
          <div className="p-3.5 bg-white border border-[#EBDCD5] rounded-3xl space-y-2">
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

          {/* FITUR GPS / GOOGLE MAPS TITIK PRESISI */}
          <div className="p-4 bg-white border-2 border-[#C97A7E]/50 rounded-3xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAEDF0] flex items-center justify-center text-[#C97A7E]">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xs text-[#2D2424]">
                    Titik GPS Google Maps <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-[10px] text-[#8A797A]">
                    Simpan titik GPS agar MUA tidak tersesat saat menuju lokasimu
                  </p>
                </div>
              </div>
            </div>

            {/* Tombol Ambil GPS Otomatis */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={gpsLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-[#FAEDF0] hover:bg-[#F5DAE0] text-[#8C4247] text-xs font-semibold flex items-center justify-center gap-2 border border-[#F1DADF] transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {gpsLoading ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-[#8C4247] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-[#C97A7E]" />
                )}
                <span>
                  {gpsLoading ? 'Mendeteksi Titik GPS...' : '📍 Ambil Titik GPS Saya (Otomatis Presisi)'}
                </span>
              </button>

              {gpsError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Status jika GPS Terkunci */}
              {gpsLatitude && gpsLongitude && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Titik GPS Terkunci: {gpsLatitude.toFixed(5)}, {gpsLongitude.toFixed(5)}
                    </span>
                  </div>
                  {currentMapLink && (
                    <a
                      href={currentMapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-emerald-700 underline flex items-center gap-0.5 hover:text-emerald-900"
                    >
                      <span>Cek di Gmaps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Input Manual / Tautan Google Maps */}
            <div>
              <label className="block text-[11px] font-medium text-[#635354] mb-1">
                Atau Tempel Tautan Link Google Maps (Share Location):
              </label>
              <input
                type="text"
                value={locationMapUrl}
                onChange={(e) => handleManualMapUrlChange(e.target.value)}
                placeholder="Cth: https://maps.app.goo.gl/... atau https://maps.google.com/?q=..."
                className="w-full text-xs p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
              />
              <span className="text-[10px] text-[#9C8E8F] mt-1 block">
                Tips: Buka Google Maps di HP kamu &rarr; Tahan pin lokasi rumah &rarr; Klik Bagikan (Share) &rarr; Salin link tautan di sini.
              </span>
            </div>
          </div>

          {/* Input Alamat Lengkap & Patokan */}
          <div className="p-4 bg-white border border-[#EBDCD5] rounded-3xl space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#2D2424] mb-1">
                Alamat Lengkap Rumah / Venue <span className="text-rose-500">*</span>
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
                Patokan Lokasi Khusus (Opsional)
              </label>
              <input
                type="text"
                value={addressBenchmark}
                onChange={(e) => onBenchmarkChange(e.target.value)}
                placeholder="Cth: Pagar putih samping minimarket, lobi selatan, dll..."
                className="w-full text-xs p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
