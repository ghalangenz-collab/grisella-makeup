'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, MessageCircle, ShieldCheck, Download, Receipt } from 'lucide-react';
import { normalizeWhatsAppNumber } from '@/lib/utils';
import MyBookingsModal from '@/components/booking/MyBookingsModal';

interface NavbarProps {
  whatsappNumber?: string;
}

export default function Navbar({ whatsappNumber }: NavbarProps) {
  const [showMyBookings, setShowMyBookings] = useState(false);

  const cleanPhone = normalizeWhatsAppNumber(whatsappNumber || '6285156847921');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Halo kak Grisella, saya ingin konsultasi seputar booking makeup ✨'
  )}`;

  const handleInstallClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pwa-install-click'));
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EBDCD5] px-3.5 py-3 transition-all">
        <div className="max-w-md mx-auto flex items-center justify-between gap-1">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-1.5 group shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#FAEDF0] border border-[#F1DADF] flex items-center justify-center text-[#C97A7E] group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif text-base font-bold tracking-wider text-[#2D2424] block leading-tight">
                GRISELLA
              </span>
              <span className="text-[9px] tracking-[0.2em] font-medium text-[#C97A7E] uppercase block">
                Makeup Artist
              </span>
            </div>
          </Link>

          {/* Action Links */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Tombol Cek Booking Saya */}
            <button
              type="button"
              onClick={() => setShowMyBookings(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#8C4247] bg-[#FAEDF0] hover:bg-[#F5DAE0] border border-[#F1DADF] rounded-full px-2.5 py-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Cek Rincian & Status Booking Saya"
            >
              <Receipt className="w-3.5 h-3.5 text-[#C97A7E]" />
              <span className="hidden sm:inline">Booking Saya</span>
              <span className="sm:hidden">Booking</span>
            </button>

            {/* Tombol Pasang Aplikasi */}
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1 text-[11px] font-medium text-[#635354] hover:text-[#C97A7E] bg-white border border-[#EBDCD5] rounded-full px-2 py-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Pasang Aplikasi di Layar Utama HP"
            >
              <Download className="w-3.5 h-3.5 text-[#C97A7E]" />
              <span className="hidden sm:inline">App</span>
            </button>

            {/* Tanya WhatsApp */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-medium text-[#635354] hover:text-[#2D2424] bg-white border border-[#EBDCD5] rounded-full px-2.5 py-1.5 shadow-2xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="hidden sm:inline">WA</span>
            </a>

            {/* Login Admin */}
            <Link
              href="/admin/login"
              className="flex items-center gap-1 text-[#9C8E8F] hover:text-[#2D2424] p-1.5 rounded-md transition-colors"
              title="Login Admin"
            >
              <ShieldCheck className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Modal Cek Booking Saya */}
      <MyBookingsModal isOpen={showMyBookings} onClose={() => setShowMyBookings(false)} />
    </>
  );
}
