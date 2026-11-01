import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('message_templates').select('*');

    const map: Record<string, string> = {
      h_minus_1:
        'Halo kak {{nama}}! ✨ Mengingatkan kembali jadwal makeup di Grisella Makeup untuk besok. Mohon bersihkan wajah dan istirahat yang cukup ya. Sampai jumpa besok! 💕',
      pelunasan:
        'Halo kak {{nama}}, terima kasih telah makeup bersama Grisella Makeup! ✨ Rincian sisa pelunasan sebesar Rp {{sisa_bayar}} dapat diserahkan langsung secara tunai atau ditransfer ke rekening BCA 123456789 a.n Grisella. Terima kasih banyak kak! 🙏',
      terima_kasih:
        'Halo kak {{nama}}! ✨ Terima kasih banyak telah mempercayakan makeup di hari spesialnya kepada Grisella Makeup. Semoga suka dengan hasilnya ya kak. Boleh tag kami di IG @grisellamakeup. Have a wonderful day! 🌸',
      hampir_hilang:
        'Hai kak {{nama}}! 💕 Udah kangen nih makeup-in kak {{nama}}. Grisella Makeup lagi ada slot kosong untuk minggu ini lho. Ada rencana acara spesial dalam waktu dekat? Yuk reservasi lagi lewat link: {{link_booking}} ✨',
    };

    if (data) {
      data.forEach((t) => {
        map[t.code] = t.body_template;
      });
    }

    return NextResponse.json({ templates: map });
  } catch {
    return NextResponse.json({ templates: {} });
  }
}
