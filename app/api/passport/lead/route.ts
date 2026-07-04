import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { lookupId, name, phone, cta } = await request.json();

    if (!lookupId || !name || !phone || !cta) {
      return NextResponse.json({ error: 'lookupId, name, phone, and cta are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from('passport_lookups')
      .update({
        lead_name: String(name).slice(0, 120),
        lead_phone: String(phone).slice(0, 40),
        cta_clicked: String(cta).slice(0, 40),
      })
      .eq('id', lookupId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
