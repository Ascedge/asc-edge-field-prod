import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const migration = read('supabase/migrations/202608210002_checkpoint4_flagship_workflow.sql')
const upload = read('app/api/photo/route.ts')
const consent = read('app/api/passport/[token]/authorization/route.ts')
const shared = read('lib/share-tokens.ts')
const passport = read('app/p/[token]/LivePassport.tsx')

const requiredStatuses = ['preliminary', 'awaiting_homeowner_authorization', 'authorized', 'documentation_in_progress', 'documentation_complete', 'published', 'annual_update_due']
for (const status of requiredStatuses) if (!migration.includes(`'${status}'`)) throw new Error(`Missing report status: ${status}`)
for (const table of ['property_authorizations', 'property_timeline_events']) {
  if (!migration.includes(`alter table public.${table} enable row level security`)) throw new Error(`${table} must use RLS`)
}
if (!migration.includes('photos_immutable') || !migration.includes('timeline_immutable') || !migration.includes('authorizations_immutable')) throw new Error('Evidence tables must have mutation guards')
if (!migration.includes('properties_status_transition_guard') || !migration.includes("phase <> 'full_house'")) throw new Error('RLS and database triggers must enforce workflow transitions')
if (!upload.includes("authorization?.decision !== 'approved'")) throw new Error('Full uploads must be authorization-gated')
for (const field of ['file_hash', 'report_version', 'upload_event_id', 'category', 'caption']) if (!upload.includes(field)) throw new Error(`Upload metadata missing ${field}`)
if (!consent.includes("affirmativeConsent") || !consent.includes("record_homeowner_authorization")) throw new Error('Consent endpoint must require affirmative evidence and use the controlled database function')
if (shared.includes('propertyId:') || passport.includes('propertyId')) throw new Error('Public Passport projection must not expose property UUID')
if (!passport.includes('setInterval(refresh, 5000)')) throw new Error('Controlled live polling fallback is required')
console.log('flagship workflow source contract passed')
