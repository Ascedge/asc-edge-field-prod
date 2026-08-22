import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync('supabase/migrations/202608210001_checkpoint3_auth_rls.sql', 'utf8')
const protectedRoutes = [
  'app/api/photo/route.ts',
  'app/api/property/route.ts',
  'app/api/property/[id]/route.ts',
  'app/api/property/observations/route.ts',
  'app/api/report-event/route.ts',
  'app/api/visit/route.ts',
  'app/api/property/[id]/share/route.ts',
  'app/api/shares/[id]/route.ts',
]

for (const table of ['organizations', 'profiles', 'organization_memberships', 'properties', 'photos', 'visits', 'report_events', 'property_access', 'share_tokens', 'audit_events']) {
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, 'i'))
}
assert.match(migration, /revoke all on table[\s\S]+from anon;/i)
assert.match(migration, /'property-evidence', 'property-evidence', false/)
assert.match(migration, /'policy-vault', 'policy-vault', false/)
assert.match(migration, /update storage\.buckets set public = false where id = 'property-photos'/)
assert.match(migration, /grant update \(display_name, active_organization_id\) on table public\.profiles to authenticated/)
assert.doesNotMatch(migration, /grant update on table public\.profiles to authenticated/)
assert.doesNotMatch(migration, /create policy[^;]+photos[^;]+for delete/is)
assert.doesNotMatch(migration, /create policy[^;]+photos[^;]+for update/is)
assert.match(migration, /create table if not exists public\.storm_events/i)
assert.match(migration, /rep_id = auth\.uid\(\)::text/)

for (const path of protectedRoutes) {
  const source = readFileSync(path, 'utf8')
  assert.match(source, /require(FieldContext|PropertyAccess)/)
  assert.doesNotMatch(source, /createSupabaseAdminClient/)
}

const shareRoute = readFileSync('app/api/property/[id]/share/route.ts', 'utf8')
assert.match(shareRoute, /token_hash: tokenHash/)
assert.doesNotMatch(shareRoute, /token_hash: rawToken/)

const publicPassport = readFileSync('lib/share-tokens.ts', 'utf8')
assert.doesNotMatch(publicPassport, /^\s*propertyId:/m)

console.log('authorization source contract passed')
