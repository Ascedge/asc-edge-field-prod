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
      tenant_id: 'gary',
      claim_status: 'unclaimed',
      // Only columns that exist in the current schema (from task 3 + schema)
      // No lat/lng, no score fields, no observations JSONB yet.
    }
  })

  // Use simple insert. If a row already exists we skip it. This is the safest for the current schema and data.
  const { error, count } = await supabase
    .from('properties')
    .insert(records)

  if (error) {
    if (error.code === '23505') {
      console.log('Some addresses already exist (normal on re-run). Continuing with existing data.')
    } else {
      console.error('Seed failed:', error)
      process.exit(1)
    }
  }

  // Get final count
  const { count: finalCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })

  console.log(`✅ Seed complete. Total properties now: ${finalCount}`)
  console.log('First few normalized addresses from source:')
  records.slice(0, 5).forEach(r => console.log('  -', r.normalized_address))
}

seedBayOaks().catch(console.error)
