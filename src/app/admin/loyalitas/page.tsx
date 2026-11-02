'use client';

import { useEffect, useState } from 'react';
import {
  Award,
  Crown,
  Heart,
  UserCheck,
  UserX,
  MessageCircle,
  TrendingUp,
  Search,
  Filter,
  Sparkles,
  Send,
  X,
} from 'lucide-react';
import { formatRupiah, formatWIBDate, normalizeWhatsAppNumber } from '@/lib/utils';
import { ClientLoyaltyView, LoyaltyBadge } from '@/types/database';

export const dynamic = 'force-dynamic';

export default function AdminLoyalitasPage() {
  const [loyaltyList, setLoyaltyList] = useState<ClientLoyaltyView[]>([]);
  const [filterBadge, setFilterBadge] = useState<string>('semua');
  const [sortBy, setSortBy] = useState<'spend' | 'visits'>('spend');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal WhatsApp Template
  const [selectedClientForWa, setSelectedClientForWa] = useState<ClientLoyaltyView | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'h_minus_1' | 'pelunasan' | 'terima_kasih' | 'hampir_hilang'>('hampir_hilang');
  const [templates, setTemplates] = useState<Record<string, string>>({
    h_minus_1: 'Halo kak {{nama}}! ✨ Mengingatkan kembali jadwal makeup Grisella Makeup besok. Mohon istirahat cukup ya. Sampai jumpa! 💕',
    pelunasan: 'Halo kak {{nama}}, terima kasih telah makeup bersama Grisella Makeup! ✨ Rincian sisa pelunasan sebesar Rp {{sisa_bayar}} dapat diserahkan tunai atau transfer ke BCA. Terima kasih kak! 🙏',
    terima_kasih: 'Halo kak {{nama}}! ✨ Terima kasih telah mempercayakan makeup kepada Grisella Makeup. Semoga suka hasilnya ya kak. Boleh tag kami di IG @grisellamakeup! 🌸',
    hampir_hilang: 'Hai kak {{nama}}! 💕 Udah kangen nih makeup-in kak {{nama}}. Grisella Makeup lagi ada slot kosong minggu ini lho. Yuk reservasi lagi: {{link_booking}} ✨',
  });

  useEffect(() => {
    fetchLoyalty();
    fetchTemplates();
  }, []);

  const fetchLoyalty = () => {
    fetch('/api/admin/loyalty')
      .then((res) => res.json())
      .then((data) => {
        if (data.loyalty) setLoyaltyList(data.loyalty);
      })
      .catch(() => {});
  };

  const fetchTemplates = () => {
    fetch('/api/admin/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.templates) setTemplates(data.templates);
      })
      .catch(() => {});
  };

  const getBadgeStyle = (badge: LoyaltyBadge) => {
    switch (badge) {
      case 'VIP':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Langganan':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Hampir Hilang':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Baru':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const filteredAndSortedList = loyaltyList
    .filter((c) => {
      const matchBadge = filterBadge === 'semua' || c.loyalty_badge === filterBadge;
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);
      return matchBadge && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'spend') return b.total_spend - a.total_spend;
      return b.total_visits - a.total_visits;
    });

  const sendWhatsAppWithTemplate = (client: ClientLoyaltyView) => {
    let body = templates[selectedTemplate] || '';
    body = body.replace(/\{\{nama\}\}/g, client.name);
    body = body.replace(/\{\{sisa_bayar\}\}/g, '0');
    body = body.replace(/\{\{link_booking\}\}/g, window.location.origin);

    const phone = client.phone_normalized || client.phone;
    const cleanPhone = normalizeWhatsAppNumber(phone);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(body)}`, '_blank');
    setSelectedClientForWa(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Analisis Loyalitas Klien</h1>
          <p className="text-xs text-[#635354]">
            Ranking pelanggan setia, riwayat kunjungan selesai, dan otomatisasi sapaan WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-60">
            <Search className="w-4 h-4 text-[#9C8E8F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama klien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#EBDCD5] bg-white"
            />
          </div>

          <div className="flex bg-white border border-[#EBDCD5] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setSortBy('spend')}
              className={`px-3 py-1.5 rounded-lg font-medium ${
                sortBy === 'spend' ? 'bg-[#C97A7E] text-white font-bold' : 'text-[#635354]'
              }`}
            >
              Belanja Teratas
            </button>
            <button
              onClick={() => setSortBy('visits')}
              className={`px-3 py-1.5 rounded-lg font-medium ${
                sortBy === 'visits' ? 'bg-[#C97A7E] text-white font-bold' : 'text-[#635354]'
              }`}
            >
              Kunjungan
            </button>
          </div>
        </div>
      </div>

      {/* Filter Badge Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['semua', 'VIP', 'Langganan', 'Baru', 'Hampir Hilang'].map((badge) => (
          <button
            key={badge}
            onClick={() => setFilterBadge(badge)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold border transition-all ${
              filterBadge === badge
                ? 'bg-[#C97A7E] text-white border-[#C97A7E] shadow-xs'
                : 'bg-white border-[#EBDCD5] text-[#635354] hover:bg-[#FAEDF0]/50'
            }`}
          >
            {badge === 'semua' ? 'Semua Klien' : badge}
          </button>
        ))}
      </div>

      {/* Leaderboard Ranking Cards */}
      <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-3">
        {filteredAndSortedList.length === 0 ? (
          <p className="text-xs text-[#9C8E8F] text-center py-8">
            Belum ada klien pada kategori ini dengan pesanan selesai.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedList.map((c, index) => {
              const isTop3 = index < 3;
              return (
                <div
                  key={c.client_id}
                  className="p-4 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#C97A7E]/50 transition-colors"
                >
                  <div className="flex items-start md:items-center gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        index === 0
                          ? 'bg-amber-400 text-amber-950 shadow-xs'
                          : index === 1
                          ? 'bg-slate-300 text-slate-800'
                          : index === 2
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-[#F7F2EB] text-[#635354]'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2D2424]">{c.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                            c.loyalty_badge
                          )}`}
                        >
                          {c.loyalty_badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#635354] block">
                        {c.phone_normalized || c.phone} &bull; Layanan Favorit:{' '}
                        <strong>{c.favorite_service || 'Bridesmaid'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Metrik Finansial & Kunjungan */}
                  <div className="flex items-center justify-between md:justify-end gap-6 text-xs">
                    <div>
                      <span className="text-[10px] text-[#9C8E8F] block">Kunjungan</span>
                      <span className="font-bold text-[#2D2424]">{c.total_visits} kali</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#9C8E8F] block">Total Belanja</span>
                      <span className="font-bold text-[#8C4247]">{formatRupiah(c.total_spend)}</span>
                    </div>

                    <button
                      onClick={() => setSelectedClientForWa(c)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Kirim WA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Kirim WhatsApp Template */}
      {selectedClientForWa && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1DADF]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#2D2424]">Kirim Pesan WhatsApp</h3>
                <span className="text-xs text-[#635354]">Kepada: {selectedClientForWa.name}</span>
              </div>
              <button onClick={() => setSelectedClientForWa(null)}>
                <X className="w-5 h-5 text-[#635354]" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#2D2424]">Pilih Template Pesan:</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#EBDCD5] bg-white font-medium"
              >
                <option value="h_minus_1">Pengingat Jadwal (H-1)</option>
                <option value="pelunasan">Tagihan Pelunasan Biaya</option>
                <option value="terima_kasih">Ucapan Terima Kasih Pasca Rias</option>
                <option value="hampir_hilang">Sapaan Ramah / Klien Hampir Hilang</option>
              </select>
            </div>

            {/* Preview Teks Template */}
            <div className="p-3 bg-[#FDFBF7] border border-[#EBDCD5] rounded-2xl text-xs space-y-1">
              <span className="text-[10px] text-[#9C8E8F] uppercase font-bold block">Preview Pesan:</span>
              <p className="text-[#2D2424] leading-relaxed italic">
                &ldquo;
                {templates[selectedTemplate]
                  ?.replace(/\{\{nama\}\}/g, selectedClientForWa.name)
                  ?.replace(/\{\{link_booking\}\}/g, 'https://...') || ''}
                &rdquo;
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedClientForWa(null)}
                className="py-2 px-4 rounded-xl border text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => sendWhatsAppWithTemplate(selectedClientForWa)}
                className="py-2 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Buka WhatsApp Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
