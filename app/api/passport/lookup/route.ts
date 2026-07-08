import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { address, source = 'qr_card' } = await request.json();
    const userAgent = request.headers.get('user-agent') || '';

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

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
    let photosData: any[] = [];

    if (propertyData) {
      matchedPropertyId = propertyData.id;

      const { data: photos } = await supabase
        .from('photos')
        .select('id, storage_url, created_at, phase')
        .eq('property_id', propertyData.id)
        .order('created_at', { ascending: false });

      photosData = photos || [];
      matched = photosData.length > 0;
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

    // Photos: pass storage_url through; sign only if it's a Supabase storage object path
    const processedPhotos = await Promise.all(
      photosData.map(async (photo: any) => {
        let url = photo.storage_url;
        if (url && url.includes('supabase.co/storage/v1/object')) {
          const marker = '/property-photos/';
          const idx = url.indexOf(marker);
          if (idx !== -1) {
            const objectPath = url.slice(idx + marker.length);
            const { data: signed } = await supabase.storage
              .from('property-photos')
              .createSignedUrl(objectPath, 3600);
            if (signed?.signedUrl) url = signed.signedUrl;
          }
        }
        return {
          url,
          taken_at: photo.created_at,
        };
      })
    );

    return NextResponse.json({
      lookupId,
      matched,
      matchedPropertyId,
      address: propertyData?.address || address,
      photos: processedPhotos,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
