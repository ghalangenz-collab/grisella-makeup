import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStoredServices, upsertStoredService } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const services = getStoredServices();
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error in GET /api/admin/services:', error);
    return NextResponse.json({ services: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const priceNum =
      body.price !== undefined
        ? Number(String(body.price).replace(/[^0-9]/g, ''))
        : 0;
    const durationNum =
      body.duration_minutes !== undefined
        ? Number(String(body.duration_minutes).replace(/[^0-9]/g, ''))
        : 60;

    // 1. Save directly to local storage
    const newService = upsertStoredService({
      name: body.name ? String(body.name).trim() : 'Layanan Baru',
      description: body.description ? String(body.description).trim() : '',
      price: priceNum,
      duration_minutes: durationNum || 60,
      is_active: body.is_active ?? true,
    });

    // 2. Best-effort Supabase sync with 1.5s timeout
    try {
      const supabase = createAdminClient();
      await Promise.race([
        supabase.from('services').insert({
          id: newService.id,
          name: newService.name,
          description: newService.description,
          price: newService.price,
          duration_minutes: newService.duration_minutes,
          is_active: newService.is_active,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
      ]);
    } catch (e) {
      console.warn('Supabase service insert sync skipped:', e);
    }

    // 3. Purge router cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin', 'layout');
    } catch {}

    return NextResponse.json({ service: newService });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Gagal menambah layanan' }, { status: 500 });
  }
}
