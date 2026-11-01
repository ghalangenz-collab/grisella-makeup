import Link from 'next/link';
import { Sparkles, MessageCircle, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  whatsappNumber?: string;
}

export default function Navbar({ whatsappNumber = '6281234567890' }: NavbarProps) {
  const cleanPhone = whatsappNumber.replace(/\D/g, '') || '6281234567890';
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Halo kak Grisella, saya ingin tanya seputar booking makeup ✨')}`;

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
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-[#635354] hover:text-[#C97A7E] bg-white border border-[#EBDCD5] rounded-full px-3 py-1.5 shadow-xs transition-colors"
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
