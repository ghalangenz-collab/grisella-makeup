import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateStoredBooking } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updatePayload.status = body.status;
      if (body.status === 'dikonfirmasi' && !body.paid_dp_at) {
        updatePayload.paid_dp_at = new Date().toISOString();
      }
    }

    if (body.total_price !== undefined) updatePayload.total_price = Number(body.total_price);
    if (body.dp_amount !== undefined) updatePayload.dp_amount = Number(body.dp_amount);
    if (body.paid_dp_at !== undefined) updatePayload.paid_dp_at = body.paid_dp_at;
    if (body.paid_settlement_at !== undefined) updatePayload.paid_settlement_at = body.paid_settlement_at;
    if (body.settlement_amount !== undefined) updatePayload.settlement_amount = Number(body.settlement_amount);
    if (body.settlement_method !== undefined) updatePayload.settlement_method = body.settlement_method;
    if (body.notes !== undefined) updatePayload.notes = body.notes;

    // 1. Update in local storage
    const updated = updateStoredBooking(id, updatePayload);

    // 2. Best-effort Supabase sync
    try {
      const supabase = createAdminClient();
      await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase booking update sync skipped:', e);
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status booking' }, { status: 500 });
  }
}
