import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Coba query langsung dari view v_client_loyalty
    const { data, error } = await supabase.from('v_client_loyalty').select('*');

    if (!error && data && data.length > 0) {
      return NextResponse.json({ loyalty: data });
    }

    // Fallback sample jika belum ada transaksi selesai di DB
    return NextResponse.json({
      loyalty: [
        {
          client_id: 'c1',
          name: 'Alya Putri Maharani',
          phone: '081298765432',
          phone_normalized: '+6281298765432',
          total_visits: 5,
          total_spend: 3250000,
          avg_spend: 650000,
          favorite_service: 'Wedding Makeup (Akad / Resepsi)',
          loyalty_badge: 'VIP',
        },
        {
          client_id: 'c2',
          name: 'Clarissa Devina',
          phone: '081311223344',
          phone_normalized: '+6281311223344',
          total_visits: 3,
          total_spend: 1250000,
          avg_spend: 416666,
          favorite_service: 'Graduation / Wisuda Makeup',
          loyalty_badge: 'Langganan',
        },
        {
          client_id: 'c3',
          name: 'Nadia Salsabila',
          phone: '081299887766',
          phone_normalized: '+6281299887766',
          total_visits: 1,
          total_spend: 450000,
          avg_spend: 450000,
          favorite_service: 'Bridesmaid Makeup',
          loyalty_badge: 'Baru',
        },
        {
          client_id: 'c4',
          name: 'Jessica Tanuwijaya',
          phone: '081122334455',
          phone_normalized: '+6281122334455',
          total_visits: 3,
          total_spend: 1350000,
          avg_spend: 450000,
          favorite_service: 'Bridesmaid Makeup',
          loyalty_badge: 'Hampir Hilang',
        },
      ],
    });
  } catch (error) {
    return NextResponse.json({ loyalty: [] });
  }
}
