'use client';

import Link from 'next/link';
import { Sparkles, MessageCircle, ShieldCheck, Download } from 'lucide-react';
import { normalizeWhatsAppNumber } from '@/lib/utils';

interface NavbarProps {
  whatsappNumber?: string;
}

export default function Navbar({ whatsappNumber }: NavbarProps) {
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
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EBDCD5] px-4 py-3 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-[#FAEDF0] border border-[#F1DADF] flex items-center justify-center text-[#C97A7E] group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold tracking-wider text-[#2D2424] block leading-tight">
              GRISELLA
            </span>
            <span className="text-[10px] tracking-[0.2em] font-medium text-[#C97A7E] uppercase block">
              Makeup Artist
            </span>
          </div>
        </Link>

        {/* Action Links */}
        <div className="flex items-center gap-2">
          {/* Tombol Pasang Aplikasi */}
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8C4247] bg-[#FAEDF0] hover:bg-[#F5DAE0] border border-[#F1DADF] rounded-full px-2.5 py-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Pasang Aplikasi di Layar Utama HP"
          >
            <Download className="w-3.5 h-3.5 text-[#C97A7E]" />
            <span className="text-[11px]">Pasang App</span>
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-[#635354] hover:text-[#C97A7E] bg-white border border-[#EBDCD5] rounded-full px-2.5 py-1.5 shadow-xs transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            <span>Tanya WA</span>
          </a>

          <Link
            href="/admin/login"
            className="flex items-center gap-1 text-xs text-[#9C8E8F] hover:text-[#2D2424] p-1.5 rounded-md transition-colors"
            title="Login Admin"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
