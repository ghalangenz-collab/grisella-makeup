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
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  HeartHandshake,
  GraduationCap,
  Palette,
  Upload,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { Service } from '@/types/database';
import { DEFAULT_SERVICES } from '@/lib/constants';
import { getAdminCache, setAdminCache } from '@/lib/admin-cache';

export const dynamic = 'force-dynamic';

const PRESET_PHOTOS = [
  {
    label: 'Bridesmaid Glow',
    url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Hijab Glam',
    url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Wedding Natural',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Wedding Luxury',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Wisuda Glowing',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Photoshoot HD',
    url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
  },
];

export default function AdminLayananPage() {
  const [services, setServices] = useState<Service[]>(() => getAdminCache<Service[]>('services') || DEFAULT_SERVICES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('Semua');

  // Edit form state
  const [editForm, setEditForm] = useState<{
    name: string;
    category: string;
    description: string;
    price: number | string;
    duration_minutes: number | string;
    image_url: string;
    is_active: boolean;
  }>({
    name: '',
    category: 'Bridesmaid',
    description: '',
    price: '',
    duration_minutes: 60,
    image_url: '',
    is_active: true,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'services');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.url) {
        setEditForm((prev) => ({ ...prev, image_url: data.url }));
        showToast('Foto hasil rias berhasil diunggah! ✨');
      }
    } catch {
      alert('Gagal mengunggah foto. Silakan coba lagi.');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = () => {
    fetch('/api/admin/services', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.services && Array.isArray(data.services)) {
          setServices(data.services);
          setAdminCache('services', data.services);
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
      category: s.category || 'Bridesmaid',
      description: s.description || '',
      price: s.price,
      duration_minutes: s.duration_minutes,
      image_url: s.image_url || '',
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
        category: editForm.category,
        description: editForm.description.trim(),
        price: cleanNumber(editForm.price),
        duration_minutes: cleanNumber(editForm.duration_minutes) || 60,
        image_url: editForm.image_url.trim() || null,
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

      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedService } : s)));
      setEditingId(null);
      showToast(`Paket "${updatedService.name}" berhasil diperbarui! ✨`);
    } catch (e) {
      console.error('Error saving service:', e);
      alert('Gagal menyimpan perubahan layanan. Silakan coba lagi.');
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
        category: editForm.category,
        description: editForm.description.trim(),
        price: cleanNumber(editForm.price),
        duration_minutes: cleanNumber(editForm.duration_minutes) || 60,
        image_url: editForm.image_url.trim() || null,
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
      showToast('Paket layanan baru berhasil ditambahkan! ✨');
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
    } catch {
      alert('Gagal menghapus layanan');
    }
  };

  const filteredServices = services.filter((s) => {
    if (selectedCategoryTab === 'Semua') return true;
    return (s.category || '').toLowerCase() === selectedCategoryTab.toLowerCase();
  });

  const getCategoryBadge = (category?: string) => {
    const cat = category || 'Bridesmaid';
    switch (cat) {
      case 'Wedding':
        return (
          <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
            <HeartHandshake className="w-3 h-3" />
            <span>Wedding</span>
          </span>
        );
      case 'Graduation':
        return (
          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            <span>Wisuda</span>
          </span>
        );
      case 'Lainnya':
        return (
          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
            <Palette className="w-3 h-3" />
            <span>Custom / Lainnya</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold bg-[#FAEDF0] text-[#8C4247] px-2 py-0.5 rounded-md border border-[#F1DADF] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Bridesmaid</span>
          </span>
        );
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
            <span>Katalog & Paket Rias Multi-Pilihan</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Kelola Paket Layanan & Foto</h1>
          <p className="text-xs text-[#635354] mt-0.5">
            Atur sub-pilihan paket untuk Bridesmaid, Wedding, Wisuda, dan Custom beserta foto hasil riasnya.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAdding(true);
            setEditForm({
              name: '',
              category: selectedCategoryTab === 'Semua' ? 'Bridesmaid' : selectedCategoryTab,
              description: '',
              price: 450000,
              duration_minutes: 60,
              image_url: PRESET_PHOTOS[0].url,
              is_active: true,
            });
          }}
          className="py-2.5 px-4 rounded-2xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Paket Baru</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['Semua', 'Bridesmaid', 'Wedding', 'Graduation', 'Lainnya'].map((cat) => {
          const isActive = selectedCategoryTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategoryTab(cat)}
              className={`shrink-0 text-xs px-4 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#C97A7E] text-white shadow-xs'
                  : 'bg-white border border-[#EBDCD5] text-[#635354] hover:bg-[#FAEDF0]'
              }`}
            >
              {cat === 'Graduation' ? 'Wisuda' : cat}
            </button>
          );
        })}
      </div>

      {/* Modal Tambah Layanan Baru */}
      {isAdding && (
        <div className="p-6 bg-white border-2 border-[#C97A7E] rounded-3xl shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FAEDF0] flex items-center justify-center text-[#C97A7E]">
                <Plus className="w-4 h-4" />
              </div>
              <h2 className="font-serif font-bold text-base text-[#2D2424]">Tambah Paket Rias Baru</h2>
            </div>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1.5 rounded-xl hover:bg-[#FAEDF0] text-[#635354] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Kategori Utama <span className="text-rose-500">*</span>
              </label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#EBDCD5] focus:outline-none focus:border-[#C97A7E] bg-white text-[#2D2424] font-medium"
              >
                <option value="Bridesmaid">Bridesmaid</option>
                <option value="Wedding">Wedding</option>
                <option value="Graduation">Graduation / Wisuda</option>
                <option value="Lainnya">Lainnya / Custom</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Nama Paket Layanan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Cth: Bridesmaid Modern Waves"
                className="w-full p-3 rounded-xl border border-[#EBDCD5] focus:outline-none focus:border-[#C97A7E] bg-white text-[#2D2424]"
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
                  value={
                    editForm.price === ''
                      ? ''
                      : typeof editForm.price === 'number'
                      ? editForm.price.toLocaleString('id-ID')
                      : editForm.price
                  }
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setEditForm({ ...editForm, price: cleaned === '' ? '' : Number(cleaned) });
                  }}
                  placeholder="0 (atau kosongkan untuk custom)"
                  className="w-full p-3 pl-9 rounded-xl border border-[#EBDCD5] focus:outline-none focus:border-[#C97A7E] bg-white text-[#2D2424] font-semibold"
                />
              </div>
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
                  className="w-full p-3 pl-9 rounded-xl border border-[#EBDCD5] focus:outline-none focus:border-[#C97A7E] bg-white text-[#2D2424]"
                />
              </div>
            </div>

            {/* Foto Layanan */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-[#2D2424]">
                  Foto Hasil Rias (URL Gambar / Unggah Foto)
                </label>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8C4247] bg-[#FAEDF0] hover:bg-[#F5DAE0] border border-[#F1DADF] px-3 py-1 rounded-xl transition-colors cursor-pointer active:scale-95">
                  <Upload className="w-3.5 h-3.5 text-[#C97A7E]" />
                  <span>{uploadingImage ? 'Mengunggah...' : '📁 Unggah Foto dari Perangkat'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/... atau URL foto rias kamu"
                  className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-xs text-[#2D2424]"
                />
                {editForm.image_url && (
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#C97A7E]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Preset Foto Cepat */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-[#9C8E8F]">Pilih Foto Contoh Cepat:</span>
                {PRESET_PHOTOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, image_url: p.url })}
                    className="text-[10px] bg-[#FAEDF0] text-[#8C4247] px-2 py-0.5 rounded-md hover:bg-[#F5DAE0] transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold mb-1 text-[#2D2424]">
                Deskripsi & Keunggulan Paket
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
                placeholder="Penjelasan look rias, produk makeup, bonus bulu mata, dll..."
                className="w-full p-3 rounded-xl border border-[#EBDCD5] focus:outline-none focus:border-[#C97A7E] bg-white text-[#2D2424] text-xs leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#F1DADF]">
            <button
              onClick={() => setIsAdding(false)}
              className="py-2.5 px-4 rounded-xl border border-[#EBDCD5] text-xs font-semibold text-[#635354] hover:bg-[#FAEDF0]/50 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleCreateService}
              disabled={loadingSave}
              className="py-2.5 px-6 rounded-xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {loadingSave ? 'Menyimpan...' : 'Simpan Paket'}
            </button>
          </div>
        </div>
      )}

      {/* Services Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((s) => {
          const isEditing = editingId === s.id;

          return (
            <div
              key={s.id}
              className={`bg-white border transition-all rounded-3xl p-4 sm:p-5 shadow-xs ${
                isEditing
                  ? 'border-2 border-[#C97A7E] shadow-md ring-2 ring-[#FAEDF0]'
                  : 'border-[#EBDCD5] hover:border-[#C97A7E]/50'
              }`}
            >
              {isEditing ? (
                /* INLINE EDIT MODE */
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F1DADF]">
                    <span className="font-bold text-xs text-[#8C4247] flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Paket Layanan</span>
                    </span>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 rounded-lg text-[#635354] hover:bg-[#FAEDF0] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold mb-1 text-[#2D2424]">Kategori</label>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] font-medium"
                      >
                        <option value="Bridesmaid">Bridesmaid</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Graduation">Graduation</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-[#2D2424]">Nama Paket</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-[#2D2424]">Tarif (Rp)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          editForm.price === ''
                            ? ''
                            : typeof editForm.price === 'number'
                            ? editForm.price.toLocaleString('id-ID')
                            : editForm.price
                        }
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          setEditForm({ ...editForm, price: cleaned === '' ? '' : Number(cleaned) });
                        }}
                        className="w-full p-2 pl-3 rounded-xl border border-[#EBDCD5] bg-white font-bold text-[#2D2424]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-[#2D2424]">Durasi (Menit)</label>
                      <input
                        type="number"
                        value={editForm.duration_minutes}
                        onChange={(e) =>
                          setEditForm({ ...editForm, duration_minutes: Number(e.target.value) })
                        }
                        className="w-full p-2 pl-3 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424]"
                      />
                    </div>
                  </div>

                  {/* Foto URL Input & Upload Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-[#2D2424]">
                        Foto Rias (URL Gambar / Unggah)
                      </label>
                      <label className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8C4247] bg-[#FAEDF0] hover:bg-[#F5DAE0] border border-[#F1DADF] px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer active:scale-95">
                        <Upload className="w-3 h-3 text-[#C97A7E]" />
                        <span>{uploadingImage ? 'Mengunggah...' : '📁 Unggah Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editForm.image_url}
                        onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                        placeholder="Tempel tautan link gambar di sini..."
                        className="w-full p-2 rounded-xl border border-[#EBDCD5] bg-white text-xs text-[#2D2424]"
                      />
                      {editForm.image_url && (
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[#C97A7E]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={editForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-[#2D2424]">Deskripsi</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={2}
                      className="w-full p-2 rounded-xl border border-[#EBDCD5] bg-white text-xs leading-relaxed text-[#2D2424]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      {editForm.is_active ? (
                        <ToggleRight className="w-6 h-6 text-[#25D366]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-[#9C8E8F]" />
                      )}
                      <span className={`text-[11px] font-semibold ${editForm.is_active ? 'text-emerald-700' : 'text-zinc-500'}`}>
                        {editForm.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="py-1.5 px-3 rounded-xl border border-[#EBDCD5] text-xs font-semibold text-[#635354] hover:bg-[#FAEDF0]/50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleSaveEdit(s.id)}
                        disabled={loadingSave}
                        className="py-1.5 px-4 rounded-xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        {loadingSave ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* READ-ONLY DISPLAY MODE WITH PHOTO */
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {/* Foto Paket */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-[#F1DADF] bg-[#FAEDF0] relative">
                      {s.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#C97A7E]">
                          <ImageIcon className="w-6 h-6 opacity-60" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        {getCategoryBadge(s.category)}
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                            s.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {s.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-sm text-[#2D2424] mt-1 truncate">
                        {s.name}
                      </h3>

                      <div className="flex items-center justify-between mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#635354] bg-[#F7F2EB] px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-[#C97A7E]" />
                          <span>{s.duration_minutes}m</span>
                        </span>
                        <span className="font-serif font-bold text-sm text-[#8C4247]">
                          {s.price === 0 ? 'Custom' : formatRupiah(s.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {s.description && (
                    <p className="text-xs text-[#635354] leading-relaxed line-clamp-2 pt-1 border-t border-[#F1DADF]/50">
                      {s.description}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => handleStartEdit(s)}
                      className="py-1 px-3 rounded-lg bg-[#FAEDF0] hover:bg-[#F5DAE0] text-[#8C4247] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Ubah Tarif & Foto</span>
                    </button>
                    {!['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'].includes(s.id) && (
                      <button
                        onClick={() => handleDeleteService(s.id, s.name)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Hapus Layanan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
