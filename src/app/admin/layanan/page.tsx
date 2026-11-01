'use client';

import { useEffect, useState } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  CheckCircle2,
  X,
  Clock,
  Trash2,
  AlertCircle,
  Tag,
  FileText,
  DollarSign,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { Service } from '@/types/database';
import { DEFAULT_SERVICES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default function AdminLayananPage() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    price: number | string;
    duration_minutes: number | string;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    price: '',
    duration_minutes: 60,
    is_active: true,
  });

  const [isAdding, setIsAdding] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = () => {
    fetch('/api/admin/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.services && Array.isArray(data.services)) {
          setServices(data.services);
        }
      })
      .catch((err) => {
        console.error('Failed to load services:', err);
      });
  };

  const handleStartEdit = (s: Service) => {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      description: s.description || '',
      price: s.price,
      duration_minutes: s.duration_minutes,
      is_active: s.is_active,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.name.trim()) {
      alert('Nama layanan tidak boleh kosong');
      return;
    }

    setLoadingSave(true);
    try {
      const cleanNumber = (val: string | number) => Number(String(val).replace(/[^0-9]/g, '')) || 0;
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: cleanNumber(editForm.price),
        duration_minutes: cleanNumber(editForm.duration_minutes) || 60,
        is_active: editForm.is_active,
      };

      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan di server');
      }

      const data = await res.json();
      const updatedService: Service = data.service || { ...payload, id, updated_at: new Date().toISOString() };

      // Update state directly for instant feedback
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedService } : s)));
      setEditingId(null);
      showToast(`Layanan "${updatedService.name}" berhasil diperbarui! ✨`);
    } catch (e) {
      console.error('Error saving service:', e);
      alert('Gagal menyimpan perubahan layanan. Periksa koneksi atau coba lagi.');
    } finally {
      setLoadingSave(false);
    }
  };

  const handleCreateService = async () => {
    if (!editForm.name.trim()) {
      alert('Nama layanan tidak boleh kosong');
      return;
    }

    setLoadingSave(true);
    try {
      const cleanNumber = (val: string | number) => Number(String(val).replace(/[^0-9]/g, '')) || 0;
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: cleanNumber(editForm.price),
        duration_minutes: cleanNumber(editForm.duration_minutes) || 60,
        is_active: editForm.is_active,
      };

      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Gagal membuat layanan di server');
      }

      const data = await res.json();
      if (data.service) {
        setServices((prev) => [...prev, data.service]);
      } else {
        fetchServices();
      }

      setIsAdding(false);
      showToast('Layanan baru berhasil ditambahkan! ✨');
    } catch (e) {
      console.error('Error creating service:', e);
      alert('Gagal membuat layanan baru. Silakan coba lagi.');
    } finally {
      setLoadingSave(false);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus layanan "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        showToast(`Layanan "${name}" telah dihapus.`);
      }
    } catch (e) {
      alert('Gagal menghapus layanan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-[#2D2424] text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-[#C97A7E] animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAEDF0] border border-[#F1DADF] text-[#8C4247] text-[11px] font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C97A7E]" />
            <span>Katalog & Tarif Jasa</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Kelola Paket Layanan</h1>
          <p className="text-xs text-[#635354] mt-0.5">
            Ubah tarif harga nominal, estimasi durasi waktu pengerjaan, dan status aktif layanan secara instan.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAdding(true);
            setEditForm({
              name: '',
              description: '',
              price: 450000,
              duration_minutes: 60,
              is_active: true,
            });
          }}
          className="py-2.5 px-4 rounded-2xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Layanan Baru</span>
        </button>
      </div>

      {/* Modal Tambah Layanan Baru */}
      {isAdding && (
        <div className="p-6 bg-white border-2 border-[#C97A7E] rounded-3xl shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FAEDF0] flex items-center justify-center text-[#C97A7E]">
                <Plus className="w-4 h-4" />
              </div>
              <h2 className="font-serif font-bold text-base text-[#2D2424]">Tambah Layanan Rias Baru</h2>
            </div>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1.5 rounded-xl hover:bg-[#FAEDF0] text-[#635354]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Nama Paket Layanan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Cth: Prewedding Glam & Retouch"
                className="w-full p-3 rounded-xl border border-[#EBDCD5] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E] bg-white text-[#2D2424]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Tarif Harga (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8C4247]">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editForm.price === '' ? '' : (typeof editForm.price === 'number' ? editForm.price.toLocaleString('id-ID') : editForm.price)}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setEditForm({ ...editForm, price: cleaned === '' ? '' : Number(cleaned) });
                  }}
                  placeholder="0 (atau kosongkan untuk custom)"
                  className="w-full p-3 pl-9 rounded-xl border border-[#EBDCD5] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E] bg-white text-[#2D2424] font-semibold"
                />
              </div>
              <span className="text-[10px] text-[#9C8E8F] mt-1 block">
                {editForm.price !== '' ? formatRupiah(Number(editForm.price)) : 'Nominal Rp 0'}
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Durasi Pengerjaan (Menit) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#C97A7E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={editForm.duration_minutes}
                  onChange={(e) => setEditForm({ ...editForm, duration_minutes: Number(e.target.value) })}
                  className="w-full p-3 pl-9 rounded-xl border border-[#EBDCD5] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E] bg-white text-[#2D2424]"
                />
              </div>
              <span className="text-[10px] text-[#9C8E8F] mt-1 block">
                Contoh: 60 (1 jam), 90 (1.5 jam), 180 (3 jam)
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Status Ketersediaan
              </label>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  className="flex items-center gap-2 text-xs font-semibold"
                >
                  {editForm.is_active ? (
                    <ToggleRight className="w-7 h-7 text-[#25D366]" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-[#9C8E8F]" />
                  )}
                  <span className={editForm.is_active ? 'text-emerald-700 font-bold' : 'text-zinc-500'}>
                    {editForm.is_active ? 'Aktif (Tampil di Web Booking)' : 'Nonaktif (Disembunyikan)'}
                  </span>
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Deskripsi & Keunggulan Layanan
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
                placeholder="Penjelasan keunggulan layanan, produk makeup yang digunakan, bonus bulu mata, dll..."
                className="w-full p-3 rounded-xl border border-[#EBDCD5] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E] bg-white text-[#2D2424] text-xs leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#F1DADF]">
            <button
              onClick={() => setIsAdding(false)}
              className="py-2.5 px-4 rounded-xl border border-[#EBDCD5] text-xs font-semibold text-[#635354] hover:bg-[#FAEDF0]/50"
            >
              Batal
            </button>
            <button
              onClick={handleCreateService}
              disabled={loadingSave}
              className="py-2.5 px-6 rounded-xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              {loadingSave ? 'Menyimpan...' : 'Simpan Layanan'}
            </button>
          </div>
        </div>
      )}

      {/* Services Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s) => {
          const isEditing = editingId === s.id;

          return (
            <div
              key={s.id}
              className={`bg-white border transition-all rounded-3xl p-5 shadow-xs ${
                isEditing
                  ? 'border-2 border-[#C97A7E] shadow-md ring-2 ring-[#FAEDF0]'
                  : 'border-[#EBDCD5] hover:border-[#C97A7E]/50'
              }`}
            >
              {isEditing ? (
                /* INLINE EDIT MODE */
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F1DADF]">
                    <span className="font-bold text-xs text-[#8C4247] flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Layanan</span>
                    </span>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 rounded-lg text-[#635354] hover:bg-[#FAEDF0]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-[#2D2424]">Nama Layanan</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-[#2D2424]">
                        Harga Nominal (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#8C4247]">
                          Rp
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editForm.price === '' ? '' : (typeof editForm.price === 'number' ? editForm.price.toLocaleString('id-ID') : editForm.price)}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^0-9]/g, '');
                            setEditForm({
                              ...editForm,
                              price: cleaned === '' ? '' : Number(cleaned),
                            });
                          }}
                          className="w-full p-2 pl-8 rounded-xl border border-[#EBDCD5] bg-white font-bold text-[#2D2424]"
                        />
                      </div>
                      <span className="text-[10px] text-[#8C4247] block mt-0.5 font-medium">
                        {editForm.price !== '' ? formatRupiah(Number(editForm.price)) : 'Rp 0'}
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-[#2D2424]">Durasi (Menit)</label>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 text-[#C97A7E] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          value={editForm.duration_minutes}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              duration_minutes: Number(e.target.value),
                            })
                          }
                          className="w-full p-2 pl-8 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-[#2D2424]">Deskripsi</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={2}
                      className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-xs leading-relaxed text-[#2D2424]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {editForm.is_active ? (
                        <ToggleRight className="w-6 h-6 text-[#25D366]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-[#9C8E8F]" />
                      )}
                      <span className={`text-[11px] font-semibold ${editForm.is_active ? 'text-emerald-700' : 'text-zinc-500'}`}>
                        {editForm.is_active ? 'Layanan Aktif' : 'Nonaktif'}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="py-1.5 px-3 rounded-xl border border-[#EBDCD5] text-xs font-semibold text-[#635354] hover:bg-[#FAEDF0]/50"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleSaveEdit(s.id)}
                        disabled={loadingSave}
                        className="py-1.5 px-4 rounded-xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold shadow-xs"
                      >
                        {loadingSave ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* READ-ONLY DISPLAY MODE */
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-base text-[#2D2424]">{s.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#635354] bg-[#F7F2EB] px-2.5 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-[#C97A7E]" />
                          <span>{s.duration_minutes} menit</span>
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                            s.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {s.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-serif font-bold text-base text-[#8C4247] block">
                        {s.name.includes('Lainnya') ? 'Custom Request' : formatRupiah(s.price)}
                      </span>
                      <div className="flex items-center justify-end gap-1.5 mt-1.5">
                        <button
                          onClick={() => handleStartEdit(s)}
                          className="py-1 px-2.5 rounded-lg bg-[#FAEDF0] hover:bg-[#F5DAE0] text-[#8C4247] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Ubah</span>
                        </button>
                        {!['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'].includes(s.id) && (
                          <button
                            onClick={() => handleDeleteService(s.id, s.name)}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg"
                            title="Hapus Layanan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {s.description && (
                    <p className="text-xs text-[#635354] leading-relaxed pt-1 border-t border-[#F1DADF]/50">
                      {s.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
