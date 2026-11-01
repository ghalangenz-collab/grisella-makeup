import Navbar from '@/components/Navbar';
import BookingStepper from '@/components/booking/BookingStepper';
import { getActiveServices, getSystemSettings } from '@/lib/services';
import { Sparkles, Calendar, Heart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [services, settings] = await Promise.all([
    getActiveServices(),
    getSystemSettings(),
  ]);

  return (
    <main className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <Navbar whatsappNumber={settings.mua_whatsapp} />

      {/* Hero Welcome Banner */}
      <section className="px-4 pt-6 pb-2 text-center max-w-md mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAEDF0] border border-[#F1DADF] text-[#8C4247] text-[11px] font-medium mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-[#C97A7E]" />
          <span>Professional Solo Makeup Artist</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#2D2424] leading-tight">
          Reservasi Jadwal Riasmu
        </h1>
        <p className="text-xs text-[#635354] mt-1.5 leading-relaxed">
          Tampil anggun memikat di hari spesial. Booking mudah, slot jadwal instan terkunci.
        </p>
      </section>

      {/* Main Interactive Stepper */}
      <section className="flex-1">
        <BookingStepper initialServices={services} initialSettings={settings} />
      </section>

      {/* Footer Branding */}
      <footer className="text-center py-6 text-[11px] text-[#9C8E8F] border-t border-[#EBDCD5] mt-auto">
        <p className="flex items-center justify-center gap-1">
          Crafted with <Heart className="w-3 h-3 text-[#C97A7E] fill-[#C97A7E]" /> for Grisella Makeup
        </p>
        <p className="text-[10px] text-[#B0A4A4] mt-0.5">
          Asia/Jakarta Timezone (WIB) &bull; Sistem Booking & CRM Resmi
        </p>
      </footer>
    </main>
  );
}
