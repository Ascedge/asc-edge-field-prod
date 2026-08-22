import { NextRequest, NextResponse } from 'next/server';
import { numberValue, readJsonObject, serverError, stringArrayValue, uuidValue } from '@/lib/http';
import { requirePropertyAccess } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const propertyId = uuidValue(body.propertyId, 'propertyId');
    const observations = stringArrayValue(body.observations, 'observations', 20);
    const fieldScore = numberValue(body.field_score, 'field_score', 0, 10);

    const { supabase } = await requirePropertyAccess(propertyId);

    const { error } = await supabase
      .from('properties')
      .update({
        observations,
        field_score: fieldScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId);

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
