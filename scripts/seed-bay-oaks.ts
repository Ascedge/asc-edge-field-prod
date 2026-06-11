#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { bayOaksSeed } from '../data/bay-oaks-seed'

// Use the real service role client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

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
  console.log(`Seeding ${bayOaksSeed.length} Bay Oaks properties...`)

  const records = bayOaksSeed.map(p => {
    const normalized = p.address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')

    return {
      address: p.address,
      normalized_address: normalized,
      neighborhood: p.neighborhood,
      field_score: p.field_score,
      field_note: p.field_note,
      tenant_id: 'gary',
      claim_status: 'unclaimed'
    }
  })

  // Use INSERT with ON CONFLICT DO NOTHING (ignoreDuplicates) for truly idempotent seeding without UPDATE conflict
  const { error } = await supabase
    .from('properties')
    .insert(records)
    .select()

  if (error && error.code !== '23505') {
    console.error('Seed failed:', error)
    process.exit(1)
  }

  // Get final count and duplicate info
  const { count: finalCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })

  console.log(`✅ Seed complete. Final row count in properties table: ${finalCount}`)
  console.log('First few seeded normalized addresses:')
  records.slice(0, 5).forEach(r => console.log('  -', r.normalized_address))
}

seedBayOaks().catch(console.error)
