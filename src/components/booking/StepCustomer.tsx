'use client';

import { User, Phone, FileText, Share2 } from 'lucide-react';
import { ClientSource } from '@/types/database';

interface StepCustomerProps {
  name: string;
  phone: string;
  notes: string;
  source: string;
  onNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onNotesChange: (val: string) => void;
  onSourceChange: (val: string) => void;
}

export default function StepCustomer({
  name,
  phone,
  notes,
  source,
  onNameChange,
  onPhoneChange,
  onNotesChange,
  onSourceChange,
}: StepCustomerProps) {
  const sources: ClientSource[] = ['Instagram', 'TikTok', 'Teman/Keluarga', 'Lainnya'];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-serif font-bold text-[#2D2424]">Data Pemesan</h2>
        <p className="text-xs text-[#635354]">
          Isi informasi kontakmu agar MUA dapat mengonfirmasi dan menghubungi terkait sesi rias.
        </p>
      </div>

      <div className="p-4 bg-white border border-[#EBDCD5] rounded-2xl space-y-3.5">
        {/* Nama Lengkap */}
        <div>
          <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#C97A7E]" />
            <span>Nama Lengkap <span className="text-red-500">*</span></span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Cth: Sarah Amanda"
            className="w-full text-xs p-3 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
          />
        </div>

        {/* Nomor WhatsApp */}
        <div>
          <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#C97A7E]" />
            <span>Nomor WhatsApp <span className="text-red-500">*</span></span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs font-semibold text-[#635354] bg-[#F7F2EB] px-1.5 py-0.5 rounded">
              +62
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="812-3456-7890"
              className="w-full text-xs p-3 pl-14 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
            />
          </div>
          <p className="text-[10px] text-[#9C8E8F] mt-1">
            * Link pembayaran dan update booking akan dikaitkan ke nomor ini.
          </p>
        </div>

        {/* Catatan Khusus */}
        <div>
          <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#C97A7E]" />
            <span>Catatan / Preferensi Makeup (Opsional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Cth: Tipe kulit kering, lebih suka lipstik warna peachy nude, tidak mau alis terlalu tebal..."
            rows={2}
            className="w-full text-xs p-3 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
          />
        </div>

        {/* Sumber Mengetahui Grisella Makeup */}
        <div>
          <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-[#C97A7E]" />
            <span>Tahu Grisella Makeup dari mana?</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sources.map((src) => {
              const isSelected = source === src;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => onSourceChange(src)}
                  className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    isSelected
                      ? 'border-[#C97A7E] bg-[#FAEDF0] text-[#8C4247] font-semibold'
                      : 'border-[#EBDCD5] text-[#635354] hover:bg-[#FDFBF7]'
                  }`}
                >
                  {src}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
