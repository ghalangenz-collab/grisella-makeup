'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Users,
  Award,
  Sparkles,
  Clock,
  TrendingUp,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  // Sembunyikan sidebar di halaman login
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }
    const session = typeof window !== 'undefined' ? localStorage.getItem('grisella_admin_session') : null;
    if (!session) {
      setIsAuthenticated(false);
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [isLoginPage, pathname, router]);

  useEffect(() => {
    const updateWIB = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      );
    };
    updateWIB();
    const interval = setInterval(updateWIB, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('grisella_admin_session');
    }
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isAuthenticated === false || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-xs text-[#635354]">
          <div className="w-6 h-6 border-2 border-[#C97A7E] border-t-transparent rounded-full animate-spin" />
          <span>Memeriksa otentikasi admin...</span>
        </div>
      </div>
    );
  }

  const navLinks = [
    { label: 'Beranda', href: '/admin', icon: LayoutDashboard },
    { label: 'Daftar Booking', href: '/admin/bookings', icon: CalendarCheck },
    { label: 'Kalender Job', href: '/admin/kalender', icon: CalendarDays },
    { label: 'Database Klien', href: '/admin/klien', icon: Users },
    { label: 'Analisis Loyalitas', href: '/admin/loyalitas', icon: Award },
    { label: 'Kelola Layanan', href: '/admin/layanan', icon: Sparkles },
    { label: 'Jam Kerja & Blokir', href: '/admin/jadwal', icon: Clock },
    { label: 'Laporan Keuangan', href: '/admin/laporan', icon: TrendingUp },
    { label: 'Pengaturan Sistem', href: '/admin/pengaturan', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#EBDCD5] sticky top-0 h-screen p-4 z-40">
        {/* Brand */}
        <div className="flex items-center gap-2.5 pb-5 border-b border-[#F1DADF]">
          <div className="w-9 h-9 rounded-xl bg-[#FAEDF0] border border-[#F1DADF] flex items-center justify-center text-[#C97A7E]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-sm text-[#2D2424] leading-tight">
              GRISELLA MUA
            </h1>
            <span className="text-[10px] text-[#C97A7E] font-semibold tracking-wider block">
              Admin & CRM Panel
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-none">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#C97A7E] text-white shadow-xs'
                    : 'text-[#635354] hover:bg-[#FAEDF0]/50 hover:text-[#C97A7E]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#F1DADF] space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#635354] hover:bg-[#FDFBF7] transition-colors"
          >
            <span>Buka Web Publik</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#9C8E8F]" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EBDCD5] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-[#EBDCD5] text-[#2D2424]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <span className="font-serif font-bold text-xs text-[#2D2424] block">
              GRISELLA ADMIN
            </span>
            <span className="text-[10px] text-[#C97A7E] font-medium">{currentTime}</span>
          </div>
        </div>

        <Link
          href="/"
          target="_blank"
          className="text-xs text-[#635354] bg-[#F7F2EB] px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
        >
          <span>Web Booking</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
          <div className="w-64 bg-white h-full p-4 flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
              <span className="font-serif font-bold text-sm text-[#2D2424]">Menu Admin</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1">
                <X className="w-5 h-5 text-[#635354]" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-[#C97A7E] text-white'
                        : 'text-[#635354] hover:bg-[#FAEDF0]/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 border-t border-[#F1DADF] pt-3"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        {/* Top Header Bar on Desktop */}
        <div className="hidden md:flex items-center justify-between bg-white border-b border-[#EBDCD5] px-6 py-3.5">
          <div className="text-xs text-[#635354]">
            Zona Waktu Operasional: <strong className="text-[#2D2424]">Asia/Jakarta (WIB)</strong>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-[#FAEDF0] text-[#8C4247] px-3 py-1 rounded-full">
              {currentTime}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#C97A7E] text-white flex items-center justify-center font-bold text-xs">
              G
            </div>
          </div>
        </div>

        {/* Content Children */}
        <div className="p-4 md:p-6 max-w-6xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
