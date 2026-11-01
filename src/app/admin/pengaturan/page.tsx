'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Phone,
  QrCode,
  CreditCard,
  Plus,
  Trash2,
  Upload,
  ExternalLink,
  Sparkles,
  Building,
  Car,
} from 'lucide-react';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { BankAccount } from '@/types/database';
import { formatRupiah } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface TransportZone {
  zone: string;
  fee: number;
}

const DEFAULT_TRANSPORT_ZONES: TransportZone[] = [
  { zone: 'Jakarta Selatan & sekitarnya (<5 km)', fee: 50000 },
  { zone: 'Jakarta Pusat / Barat / Timur (5-15 km)', fee: 100000 },
  { zone: 'Tangerang / Depok / Bekasi / Luar Kota (>15 km)', fee: 175000 },
];

export default function AdminPengaturanPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    { id: '1', bank_name: 'BCA', account_number: '8735091234', account_name: 'GRISELLA PUTRI' },
    { id: '2', bank_name: 'Bank Mandiri', account_number: '1370019283741', account_name: 'GRISELLA PUTRI' },
    { id: '3', bank_name: 'Bank BRI', account_number: '034101002345501', account_name: 'GRISELLA PUTRI' },
  ]);
  const [transportZones, setTransportZones] = useState<TransportZone[]>(DEFAULT_TRANSPORT_ZONES);

  const [loading, setLoading] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.bank_accounts) {
            try {
              const parsed = JSON.parse(data.settings.bank_accounts);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setBankAccounts(parsed);
              }
            } catch (e) {
              console.error('Error parsing bank accounts:', e);
            }
          }
          if (data.settings.transport_fee_zones) {
            try {
              const parsedZones = JSON.parse(data.settings.transport_fee_zones);
              if (Array.isArray(parsedZones) && parsedZones.length > 0) {
                setTransportZones(parsedZones);
              }
            } catch (e) {
              console.error('Error parsing transport zones:', e);
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSavedSuccess(false);
  };

  // QRIS File Upload handler
  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQris(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'qris');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (data.url) {
        handleChange('qris_image_url', data.url);
      }
    } catch {
      alert('Gagal mengunggah foto barcode QRIS');
    } finally {
      setUploadingQris(false);
    }
  };

  // Bank Accounts Management
  const handleAddBankAccount = () => {
    const newAccount: BankAccount = {
      id: `bank-${Date.now()}`,
      bank_name: 'BCA',
      account_number: '',
      account_name: 'GRISELLA PUTRI',
    };
    setBankAccounts((prev) => [...prev, newAccount]);
    setSavedSuccess(false);
  };

  const handleUpdateBankAccount = (id: string, field: keyof BankAccount, val: string) => {
    setBankAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, [field]: val } : acc))
    );
    setSavedSuccess(false);
  };

  const handleDeleteBankAccount = (id: string) => {
    if (bankAccounts.length <= 1) {
      alert('Minimal harus ada 1 rekening bank aktif');
      return;
    }
    setBankAccounts((prev) => prev.filter((acc) => acc.id !== id));
    setSavedSuccess(false);
  };

  // Transport Zones Management
  const handleAddZone = () => {
    setTransportZones((prev) => [
      ...prev,
      { zone: 'Area Baru / Luar Wilayah', fee: 100000 },
    ]);
    setSavedSuccess(false);
  };

  const handleUpdateZone = (index: number, field: 'zone' | 'fee', val: string | number) => {
    setTransportZones((prev) =>
      prev.map((z, i) => (i === index ? { ...z, [field]: val } : z))
    );
    setSavedSuccess(false);
  };

  const handleDeleteZone = (index: number) => {
    if (transportZones.length <= 1) {
      alert('Minimal harus ada 1 zona transport');
      return;
    }
    setTransportZones((prev) => prev.filter((_, i) => i !== index));
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payloadSettings = {
        ...settings,
        bank_accounts: JSON.stringify(bankAccounts),
        transport_fee_zones: JSON.stringify(transportZones),
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payloadSettings }),
      });

      if (!res.ok) throw new Error();

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch {
      alert('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAEDF0] border border-[#F1DADF] text-[#8C4247] text-[11px] font-semibold mb-1">
            <Settings className="w-3.5 h-3.5 text-[#C97A7E]" />
            <span>Konfigurasi Usaha MUA</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Pengaturan Sistem</h1>
          <p className="text-xs text-[#635354] mt-0.5">
            Atur barcode QRIS milikmu, nomor rekening bank, kebijakan DP, dan kontak MUA.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-4 py-2 rounded-2xl font-semibold border border-emerald-200 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan Berhasil Disimpan & Aktif! ✨</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* BAGIAN 1: PEMBAYARAN QRIS PEMILIK (PENGGANTI MIDTRANS) */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FAEDF0] flex items-center justify-center text-[#C97A7E]">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm text-[#2D2424]">
                  Metode Pembayaran 1: Barcode QRIS Pemilik
                </h2>
                <span className="text-[10px] text-[#635354]">
                  Dikelola langsung oleh MUA (tanpa potongan gateway Midtrans)
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
              Langsung Masuk Rekeningmu
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Preview QRIS */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#FDFBF7] border border-[#EBDCD5] rounded-2xl text-center space-y-2">
              <span className="text-[11px] font-semibold text-[#2D2424]">Tampilan QRIS di Web</span>
              <div className="w-44 h-44 bg-white p-2 rounded-2xl border border-[#EBDCD5] shadow-xs flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.qris_image_url || '/images/qris-grisella.svg'}
                  alt="QRIS Preview"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <span className="text-[10px] text-[#9C8E8F]">
                {settings.qris_merchant_name || 'GRISELLA MAKEUP'}
              </span>
            </div>

            {/* Form Upload QRIS */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-[#2D2424]">
                  Upload Gambar Barcode QRIS Kamu
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleQrisUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingQris}
                    className="py-2.5 px-4 rounded-xl border border-[#C97A7E] bg-[#FAEDF0] text-[#8C4247] hover:bg-[#F5DAE0] font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingQris ? 'Mengunggah...' : 'Pilih Foto QRIS dari HP / Laptop'}</span>
                  </button>
                </div>
                <span className="text-[10px] text-[#9C8E8F] mt-1 block">
                  Bisa upload screenshot QRIS BCA, QRIS Livin Mandiri, Gopay Merchant, Dana Bisnis, atau bank manapun.
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2D2424]">
                  Atau Input URL Gambar QRIS
                </label>
                <input
                  type="text"
                  value={settings.qris_image_url || ''}
                  onChange={(e) => handleChange('qris_image_url', e.target.value)}
                  placeholder="/images/qris-grisella.svg atau https://..."
                  className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#2D2424]">
                    Nama Usaha / Merchant di QRIS
                  </label>
                  <input
                    type="text"
                    value={settings.qris_merchant_name || 'GRISELLA MAKEUP'}
                    onChange={(e) => handleChange('qris_merchant_name', e.target.value)}
                    placeholder="GRISELLA MAKEUP"
                    className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#2D2424]">
                    Nomor NMID (Opsional)
                  </label>
                  <input
                    type="text"
                    value={settings.qris_nmid || 'ID102034091283'}
                    onChange={(e) => handleChange('qris_nmid', e.target.value)}
                    placeholder="ID102034091283"
                    className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 2: DAFTAR REKENING BANK MANUAL */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm text-[#2D2424]">
                  Metode Pembayaran 2: Rekening Bank Transfer Manual
                </h2>
                <span className="text-[10px] text-[#635354]">
                  Klien dapat memilih salah satu bank dan klik &ldquo;Salin No Rekening&rdquo;
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddBankAccount}
              className="py-1.5 px-3 rounded-xl bg-[#FAEDF0] text-[#8C4247] hover:bg-[#F5DAE0] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rekening Bank</span>
            </button>
          </div>

          <div className="space-y-3">
            {bankAccounts.map((acc, index) => (
              <div
                key={acc.id}
                className="p-4 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
              >
                <div className="sm:col-span-3">
                  <label className="block font-semibold mb-1 text-[11px] text-[#2D2424]">
                    Nama Bank / E-Wallet
                  </label>
                  <input
                    type="text"
                    value={acc.bank_name}
                    onChange={(e) => handleUpdateBankAccount(acc.id, 'bank_name', e.target.value)}
                    placeholder="BCA / Mandiri / BRI / SeaBank"
                    className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white font-semibold text-[#2D2424]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-semibold mb-1 text-[11px] text-[#2D2424]">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={acc.account_number}
                    onChange={(e) => handleUpdateBankAccount(acc.id, 'account_number', e.target.value)}
                    placeholder="8735091234"
                    className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white font-mono font-bold text-[#2D2424]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-semibold mb-1 text-[11px] text-[#2D2424]">
                    Atas Nama (Pemilik Rekening)
                  </label>
                  <input
                    type="text"
                    value={acc.account_name}
                    onChange={(e) => handleUpdateBankAccount(acc.id, 'account_name', e.target.value)}
                    placeholder="GRISELLA PUTRI"
                    className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteBankAccount(acc.id)}
                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Hapus Rekening"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BAGIAN 3: KEBIJAKAN BOOKING & DP */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1DADF]">
            <div className="w-8 h-8 rounded-xl bg-[#FAEDF0] flex items-center justify-center text-[#C97A7E]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-sm text-[#2D2424]">
                Kebijakan Booking & Jeda Waktu (Buffer)
              </h2>
              <span className="text-[10px] text-[#635354]">
                Aturan persentase uang muka dan jeda antar sesi pengerjaan
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Persentase Down Payment / DP (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.dp_percentage || '30'}
                  onChange={(e) => handleChange('dp_percentage', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C4247] font-semibold">
                  %
                </span>
              </div>
              <span className="text-[10px] text-[#9C8E8F] mt-1 block">
                Contoh: 30% dari total biaya layanan
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Minimal Jam Booking Hari Sama (Same-Day)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.min_hours_same_day || '3'}
                  onChange={(e) => handleChange('min_hours_same_day', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C4247]">
                  Jam
                </span>
              </div>
              <span className="text-[10px] text-[#9C8E8F] mt-1 block">
                Mencegah order mendadak tanpa persiapan MUA
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Jeda Antar Job di Studio (Menit)
              </label>
              <input
                type="number"
                value={settings.buffer_studio_minutes || '30'}
                onChange={(e) => handleChange('buffer_studio_minutes', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
              />
              <span className="text-[10px] text-[#9C8E8F] mt-1 block">
                Waktu istirahat & sterilisasi kuas/alat makeup (standar: 30 menit)
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Jeda Antar Job Home Service (Menit)
              </label>
              <input
                type="number"
                value={settings.buffer_home_minutes || '60'}
                onChange={(e) => handleChange('buffer_home_minutes', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
              />
              <span className="text-[10px] text-[#9C8E8F] mt-1 block">
                Waktu estimasi perjalanan macet di jalan (standar: 60 menit)
              </span>
            </div>
          </div>
        </div>

        {/* BAGIAN 4: TARIF & ZONA TRANSPORTASI HOME SERVICE */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm text-[#2D2424]">
                  Metode Tambahan: Tarif Transportasi Home Service per Area
                </h2>
                <span className="text-[10px] text-[#635354]">
                  Atur nominal ongkos jalan MUA ke rumah/lokasi klien sesuai jarak wilayah
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddZone}
              className="py-1.5 px-3 rounded-xl bg-[#FAEDF0] text-[#8C4247] hover:bg-[#F5DAE0] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Zona Area</span>
            </button>
          </div>

          <div className="space-y-3">
            {transportZones.map((z, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
              >
                <div className="sm:col-span-7">
                  <label className="block font-semibold mb-1 text-[11px] text-[#2D2424]">
                    Nama Area / Keterangan Jarak Wilayah
                  </label>
                  <input
                    type="text"
                    value={z.zone}
                    onChange={(e) => handleUpdateZone(idx, 'zone', e.target.value)}
                    placeholder="Cth: Jakarta Selatan & sekitarnya (<5 km)"
                    className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white font-medium text-[#2D2424]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-semibold mb-1 text-[11px] text-[#2D2424]">
                    Tarif Transport (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C4247]">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={typeof z.fee === 'number' ? z.fee.toLocaleString('id-ID') : z.fee}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        handleUpdateZone(idx, 'fee', cleaned === '' ? 0 : Number(cleaned));
                      }}
                      placeholder="50000"
                      className="w-full p-2.5 pl-8 rounded-xl border border-[#EBDCD5] bg-white font-mono font-bold text-[#2D2424]"
                    />
                  </div>
                  <span className="text-[10px] text-[#8C4247] mt-0.5 block font-medium">
                    {formatRupiah(z.fee)}
                  </span>
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteZone(idx)}
                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Hapus Zona Area"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BAGIAN 5: KONTAK WHATSAPP & ALAMAT STUDIO */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1DADF]">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-sm text-[#2D2424]">
                Kontak WhatsApp & Alamat Studio
              </h2>
              <span className="text-[10px] text-[#635354]">
                Digunakan untuk tombol chat WhatsApp klien & petunjuk lokasi
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Nomor WhatsApp MUA Aktif (Format 62...)
              </label>
              <input
                type="text"
                value={settings.mua_whatsapp || '6281234567890'}
                onChange={(e) => handleChange('mua_whatsapp', e.target.value)}
                placeholder="6281234567890"
                className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white font-mono text-[#2D2424]"
              />
              <span className="text-[10px] text-[#9C8E8F] mt-1 block">
                Gunakan awalan 62 (tanpa tanda + dan spasi). Klien akan langsung dialihkan ke nomor ini.
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Alamat Lengkap Studio Rias
              </label>
              <textarea
                value={settings.studio_address || ''}
                onChange={(e) => handleChange('studio_address', e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Ketentuan & Kebijakan Pembatalan
              </label>
              <textarea
                value={settings.cancellation_policy || ''}
                onChange={(e) => handleChange('cancellation_policy', e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-8 rounded-2xl bg-[#C97A7E] hover:bg-[#B5676B] text-white font-semibold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
