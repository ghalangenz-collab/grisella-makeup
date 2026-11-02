'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  MessageCircle,
  GitMerge,
  Eye,
  Calendar,
  Sparkles,
  Edit2,
  X,
  Phone,
  CheckCircle,
} from 'lucide-react';
import { formatRupiah, formatWIBDate, formatWIBTime, normalizeWhatsAppNumber } from '@/lib/utils';
import { Client, Booking } from '@/types/database';

export const dynamic = 'force-dynamic';

export default function AdminKlienPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientBookings, setClientBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal Edit Profil & Catatan Makeup
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    skin_type: '',
    allergies: '',
    birthday: '',
    notes_shade: '',
    notes_lipstick: '',
    notes_favorite_style: '',
  });

  // Modal Gabung Klien (Merge)
  const [isMerging, setIsMerging] = useState(false);
  const [sourceClientId, setSourceClientId] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = () => {
    fetch('/api/admin/clients')
      .then((res) => res.json())
      .then((data) => {
        if (data.clients) setClients(data.clients);
      })
      .catch(() => {});
  };

  const handleSelectClient = (c: Client) => {
    setSelectedClient(c);
    setEditForm({
      name: c.name,
      phone: c.phone,
      skin_type: c.skin_type || '',
      allergies: c.allergies || '',
      birthday: c.birthday || '',
      notes_shade: c.notes_shade || '',
      notes_lipstick: c.notes_lipstick || '',
      notes_favorite_style: c.notes_favorite_style || '',
    });

    // Ambil riwayat order klien ini
    fetch(`/api/admin/clients/${c.id}/bookings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bookings) setClientBookings(data.bookings);
      })
      .catch(() => setClientBookings([]));
  };

  const handleSaveProfile = async () => {
    if (!selectedClient) return;
    try {
      await fetch(`/api/admin/clients/${selectedClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      setIsEditing(false);
      fetchClients();
      setSelectedClient({ ...selectedClient, ...editForm });
    } catch {
      alert('Gagal menyimpan profil klien');
    }
  };

  const handleMergeClients = async () => {
    if (!selectedClient || !sourceClientId) {
      alert('Pilih klien duplikat yang akan digabungkan');
      return;
    }

    if (confirm('Apakah kamu yakin ingin menggabungkan kedua kontak ini? Seluruh pesanan klien duplikat akan dipindahkan ke klien utama ini.')) {
      try {
        const res = await fetch('/api/admin/clients/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_id: selectedClient.id,
            source_id: sourceClientId,
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert('Berhasil menggabungkan klien!');
          setIsMerging(false);
          fetchClients();
          handleSelectClient(selectedClient);
        } else {
          alert(data.error || 'Gagal menggabungkan');
        }
      } catch {
        alert('Gagal memproses penggabungan');
      }
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.phone_normalized.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Database Klien CRM</h1>
          <p className="text-xs text-[#635354]">
            Riwayat kontak, preferensi warna makeup, catatan alergi, dan riwayat pesanan klien.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#9C8E8F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau nomor WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#EBDCD5] bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1: Daftar Klien (1 Kolom) */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-4 shadow-xs space-y-3">
          <span className="text-xs font-bold text-[#2D2424] px-1 block">
            Total {filteredClients.length} Klien Terdaftar
          </span>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredClients.map((c) => {
              const isSelected = selectedClient?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#C97A7E] bg-[#FAEDF0]/50 shadow-xs'
                      : 'border-[#EBDCD5] hover:bg-[#FDFBF7]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#2D2424]">{c.name}</span>
                    <span className="text-[10px] text-[#C97A7E] font-medium bg-[#FAEDF0] px-2 py-0.5 rounded-full">
                      {c.source || 'Instagram'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#635354] block mt-0.5">
                    {c.phone_normalized || c.phone}
                  </span>
                  {c.skin_type && (
                    <span className="text-[10px] text-[#9C8E8F] block mt-1">
                      Kulit: {c.skin_type}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom 2: Profil & Riwayat Klien Terpilih (2 Kolom) */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedClient ? (
            <div className="bg-white border border-[#EBDCD5] rounded-3xl p-12 text-center text-xs text-[#9C8E8F] shadow-xs">
              <Users className="w-10 h-10 text-[#C97A7E]/50 mx-auto mb-2" />
              <span>Pilih salah satu klien dari daftar di sebelah kiri untuk melihat profil lengkap.</span>
            </div>
          ) : (
            <>
              {/* Profil Card */}
              <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1DADF]">
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[#2D2424]">
                      {selectedClient.name}
                    </h2>
                    <span className="text-xs text-[#635354] font-medium">
                      WhatsApp: {selectedClient.phone_normalized || selectedClient.phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${normalizeWhatsAppNumber(selectedClient.phone_normalized || selectedClient.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat WA</span>
                    </a>

                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="py-1.5 px-3 rounded-xl bg-[#FAEDF0] text-[#8C4247] text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Batal' : 'Edit Profil'}</span>
                    </button>

                    <button
                      onClick={() => setIsMerging(true)}
                      className="py-1.5 px-3 rounded-xl border border-[#EBDCD5] text-[#635354] text-xs font-semibold flex items-center gap-1.5"
                      title="Gabungkan kontak duplikat"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Gabung</span>
                    </button>
                  </div>
                </div>

                {/* Form Edit atau Tampilan Catatan Makeup Personal */}
                {isEditing ? (
                  <div className="space-y-3 text-xs bg-[#FDFBF7] p-4 rounded-2xl border border-[#EBDCD5]">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Tipe Kulit</label>
                        <input
                          type="text"
                          value={editForm.skin_type}
                          onChange={(e) => setEditForm({ ...editForm, skin_type: e.target.value })}
                          placeholder="Cth: Kering / Sensitif / Kombinasi"
                          className="w-full p-2 rounded-xl border border-[#EBDCD5] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Tanggal Lahir</label>
                        <input
                          type="date"
                          value={editForm.birthday}
                          onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#EBDCD5] bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Riwayat Alergi Kosmetik</label>
                      <input
                        type="text"
                        value={editForm.allergies}
                        onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                        placeholder="Cth: Alergi fragrance, komedogenik..."
                        className="w-full p-2 rounded-xl border border-[#EBDCD5] bg-white"
                      />
                    </div>

                    <div className="pt-2 border-t border-[#F1DADF] space-y-2">
                      <span className="font-bold text-[#8C4247] block">Catatan Makeup Personal (CRM):</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold mb-1">Shade Foundation</label>
                          <input
                            type="text"
                            value={editForm.notes_shade}
                            onChange={(e) => setEditForm({ ...editForm, notes_shade: e.target.value })}
                            placeholder="Warm Beige 02"
                            className="w-full p-2 rounded-xl border border-[#EBDCD5] bg-white text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold mb-1">Warna Lipstik</label>
                          <input
                            type="text"
                            value={editForm.notes_lipstick}
                            onChange={(e) => setEditForm({ ...editForm, notes_lipstick: e.target.value })}
                            placeholder="Nude Peach Satin"
                            className="w-full p-2 rounded-xl border border-[#EBDCD5] bg-white text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold mb-1">Gaya Favorit</label>
                          <input
                            type="text"
                            value={editForm.notes_favorite_style}
                            onChange={(e) => setEditForm({ ...editForm, notes_favorite_style: e.target.value })}
                            placeholder="Soft Glam Glow"
                            className="w-full p-2 rounded-xl border border-[#EBDCD5] bg-white text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="py-1.5 px-3 rounded-xl border text-xs"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="py-1.5 px-4 rounded-xl bg-[#C97A7E] text-white text-xs font-semibold"
                      >
                        Simpan Catatan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-[#FDFBF7] rounded-2xl border border-[#EBDCD5]">
                      <span className="text-[10px] text-[#9C8E8F] uppercase block font-semibold">Tipe Kulit</span>
                      <span className="font-bold text-[#2D2424] mt-0.5 block">{selectedClient.skin_type || 'Belum diisi'}</span>
                    </div>

                    <div className="p-3 bg-[#FDFBF7] rounded-2xl border border-[#EBDCD5]">
                      <span className="text-[10px] text-[#9C8E8F] uppercase block font-semibold">Alergi Produk</span>
                      <span className="font-bold text-[#8C4247] mt-0.5 block">{selectedClient.allergies || 'Tidak ada'}</span>
                    </div>

                    <div className="p-3 bg-[#FDFBF7] rounded-2xl border border-[#EBDCD5]">
                      <span className="text-[10px] text-[#9C8E8F] uppercase block font-semibold">Shade Foundation</span>
                      <span className="font-bold text-[#2D2424] mt-0.5 block">{selectedClient.notes_shade || 'Belum dicatat'}</span>
                    </div>

                    <div className="p-3 bg-[#FDFBF7] rounded-2xl border border-[#EBDCD5]">
                      <span className="text-[10px] text-[#9C8E8F] uppercase block font-semibold">Lipstik Favorit</span>
                      <span className="font-bold text-[#2D2424] mt-0.5 block">{selectedClient.notes_lipstick || 'Belum dicatat'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Riwayat Booking Klien Ini */}
              <div className="bg-white border border-[#EBDCD5] rounded-3xl p-5 shadow-xs space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#2D2424]">
                  Riwayat Pemesanan ({clientBookings.length} order)
                </h3>

                {clientBookings.length === 0 ? (
                  <p className="text-xs text-[#9C8E8F] text-center py-4">Belum ada riwayat pesanan.</p>
                ) : (
                  <div className="space-y-2">
                    {clientBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#2D2424] block">{b.makeup_type}</span>
                          <span className="text-[11px] text-[#635354]">
                            {formatWIBDate(b.start_at, 'dd MMM yyyy')} ({b.service_location === 'studio' ? 'Studio' : 'Home Service'})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#2D2424] block">{formatRupiah(b.total_price)}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              b.status === 'selesai'
                                ? 'bg-purple-50 text-purple-700'
                                : b.status === 'dikonfirmasi'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {b.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Gabungkan Klien */}
      {isMerging && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1DADF]">
              <h3 className="font-serif font-bold text-sm text-[#2D2424]">Gabungkan Dua Klien Duplikat</h3>
              <button onClick={() => setIsMerging(false)}>
                <X className="w-5 h-5 text-[#635354]" />
              </button>
            </div>

            <p className="text-xs text-[#635354]">
              Klien utama: <strong>{selectedClient.name}</strong> ({selectedClient.phone_normalized}). Pilih akun klien duplikat di bawah ini untuk dipindahkan seluruh riwayat booking-nya:
            </p>

            <select
              value={sourceClientId}
              onChange={(e) => setSourceClientId(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-[#EBDCD5] bg-white"
            >
              <option value="">-- Pilih Klien Duplikat --</option>
              {clients
                .filter((c) => c.id !== selectedClient.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone_normalized}
                  </option>
                ))}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsMerging(false)}
                className="py-2 px-4 rounded-xl border text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleMergeClients}
                className="py-2 px-4 rounded-xl bg-[#C97A7E] text-white text-xs font-semibold"
              >
                Gabungkan Kontak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
