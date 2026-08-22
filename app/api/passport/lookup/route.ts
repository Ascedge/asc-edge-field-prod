import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { readJsonObject, serverError, stringValue } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const address = stringValue(body.address, 'address', { required: true, maxLength: 240 })!;
    const source = stringValue(body.source ?? 'qr_card', 'source', { required: true, maxLength: 40 })!;
    const userAgent = request.headers.get('user-agent') || '';

    const normalizedAddress = address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');

    const supabase = createSupabaseAdminClient();

    let propertyData = null;

    // Exact match first (READ-ONLY — this route never inserts into properties)
    const { data: exactProp } = await supabase
      .from('properties')
      .select('id, address, normalized_address, neighborhood, field_score')
      .eq('normalized_address', normalizedAddress)
      .single();

    if (exactProp) {
      propertyData = exactProp;
    } else {
      // Partial fallback with HOUSE-NUMBER GUARD:
      // never show a different house number's roof to this visitor.
      const houseNumber = normalizedAddress.match(/^\d+/)?.[0];
      if (houseNumber) {
        const partial = `%${normalizedAddress}%`;
        const { data: partialProp } = await supabase
          .from('properties')
          .select('id, address, normalized_address, neighborhood, field_score')
          .ilike('address', partial)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (partialProp) {
          const candidateNumber = (partialProp.normalized_address || partialProp.address || '')
            .toLowerCase()
            .trim()
            .match(/^\d+/)?.[0];
          if (candidateNumber === houseNumber) {
            propertyData = partialProp;
          }
        }
      }
    }

    let matched = false;
    let matchedPropertyId = null;

    if (propertyData) {
      matchedPropertyId = propertyData.id;

      const { count } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyData.id)
        .eq('phase', 'pre_knock');
      matched = (count || 0) > 0;
    }

    // Always log the lookup — matched or not
    const { data: lookupRow, error: lookupError } = await supabase
      .from('passport_lookups')
      .insert({
        raw_address: address,
        normalized_address: normalizedAddress,
        matched,
        matched_property_id: matchedPropertyId,
        source,
        user_agent: userAgent,
      })
      .select('id')
      .single();

    if (lookupError) {
      console.error('Lookup insert error:', lookupError);
    }

    const lookupId = lookupRow?.id;

    return NextResponse.json({
      lookupId,
      matched,
      address: propertyData?.address || address,
      photos: [],
    });
  } catch (error) {
    if (error instanceof Error && /required|must be/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return serverError(error);
  }
}
