'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, MessageCircle, ShieldCheck, Download, Receipt, User } from 'lucide-react';
import { normalizeWhatsAppNumber } from '@/lib/utils';
import MyBookingsModal from '@/components/booking/MyBookingsModal';
import { getUserSession, setUserSession, UserProfile } from '@/lib/auth-user';
import { createClient } from '@/lib/supabase/client';

interface NavbarProps {
  whatsappNumber?: string;
}

export default function Navbar({ whatsappNumber }: NavbarProps) {
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const cleanPhone = normalizeWhatsAppNumber(whatsappNumber || '6285156847921');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Halo kak Grisella, saya ingin konsultasi seputar booking makeup ✨'
  )}`;

  useEffect(() => {
    setCurrentUser(getUserSession());

    const handleAuthChange = (e: any) => {
      setCurrentUser(e.detail);
    };

    window.addEventListener('grisella-user-auth-change', handleAuthChange);

    // Sinkronkan dari Supabase Auth session jika ada
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const u = data.session.user;
          const meta = u.user_metadata || {};
          const profile: UserProfile = {
            id: u.id,
            email: u.email || '',
            full_name: meta.full_name || u.email?.split('@')[0] || 'Pelanggan',
            phone: meta.phone,
            role: 'user',
          };
          setUserSession(profile);
          setCurrentUser(profile);
        }
      });
    } catch {}

    return () => {
      window.removeEventListener('grisella-user-auth-change', handleAuthChange);
    };
  }, []);

  const handleInstallClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pwa-install-click'));
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EBDCD5] px-3 py-3 transition-all">
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
          <div className="flex items-center gap-1 shrink-0">
            {/* User Account / Login Button */}
            {currentUser ? (
              <Link
                href="/akun"
                className="flex items-center gap-1 text-[11px] font-semibold text-[#8C4247] bg-[#FAEDF0] hover:bg-[#F5DAE0] border border-[#F1DADF] rounded-full px-2.5 py-1.5 shadow-2xs transition-all active:scale-95"
                title={`Akun Saya: ${currentUser.full_name}`}
              >
                <User className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span className="truncate max-w-[65px] sm:max-w-[90px]">
                  {currentUser.full_name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 text-[11px] font-semibold text-[#8C4247] bg-[#FAEDF0] hover:bg-[#F5DAE0] border border-[#F1DADF] rounded-full px-2.5 py-1.5 shadow-2xs transition-all active:scale-95"
                title="Masuk / Daftar Akun Pelanggan"
              >
                <User className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span>Masuk</span>
              </Link>
            )}

            {/* Tombol Cek Booking Saya */}
            <button
              type="button"
              onClick={() => setShowMyBookings(true)}
              className="flex items-center gap-1 text-[11px] font-medium text-[#635354] hover:text-[#2D2424] bg-white border border-[#EBDCD5] rounded-full px-2 py-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Cek Rincian & Status Booking Saya"
            >
              <Receipt className="w-3.5 h-3.5 text-[#C97A7E]" />
              <span className="hidden sm:inline">Booking</span>
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
              className="flex items-center gap-1 text-[11px] font-medium text-[#635354] hover:text-[#2D2424] bg-white border border-[#EBDCD5] rounded-full px-2 py-1.5 shadow-2xs transition-colors"
              title="Hubungi WhatsApp MUA"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
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
