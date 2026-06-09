#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { bayOaksProperties } from '../../Ascedge_field_app/data/bay-oaks-properties.js'

// Use the real service role client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seedBayOaks() {
  console.log(`Seeding ${bayOaksProperties.length} Bay Oaks properties...`)

  const records = bayOaksProperties.map(p => {
    const normalized = p.address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')

    return {
      address: p.address,
      normalized_address: normalized,
      lat: p.lat,
      lng: p.lng,
      replacement_score: p.replacementScore,
      listing_risk_score: p.listingRiskScore,
      roof_age: p.roofAge,
      roof_type: p.roofType,
      year_built: p.yearBuilt,
      tenant_id: 'gary',
      claim_status: 'unclaimed'
    }
  })

  // Use upsert on normalized_address (now that columns exist)
  const { error, count } = await supabase
    .from('properties')
    .upsert(records, {
      onConflict: 'normalized_address'
    })

  if (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }

  // Get final count
  const { count: finalCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })

  console.log(`✅ Successfully upserted ${count} Bay Oaks properties. Total now: ${finalCount}`)
  console.log('First few normalized addresses:')
  records.slice(0, 5).forEach(r => console.log('  -', r.normalized_address))
}

seedBayOaks().catch(console.error)
