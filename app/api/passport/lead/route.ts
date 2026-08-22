import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { readJsonObject, serverError, stringValue, uuidValue } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const lookupId = uuidValue(body.lookupId, 'lookupId');
    const name = stringValue(body.name, 'name', { required: true, maxLength: 120 })!;
    const phone = stringValue(body.phone, 'phone', { required: true, maxLength: 40 })!;
    const cta = stringValue(body.cta, 'cta', { required: true, maxLength: 40 })!;

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from('passport_lookups')
      .update({
        lead_name: name,
        lead_phone: phone,
        cta_clicked: cta,
      })
      .eq('id', lookupId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && /required|UUID|must be/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return serverError(error);
  }
}
