import { readFileSync } from 'node:fs'
const report = readFileSync('components/PassportExperience.tsx', 'utf8')
const sources = readFileSync('lib/passport-sources.ts', 'utf8')
const migration = readFileSync('supabase/migrations/202608210003_checkpoint5_passport.sql', 'utf8')

for (const section of ['overview','timeline','photos','storm-history','maintenance','documents','policy-vault','certificates','sources','next-actions']) {
  if (!report.includes(`'${section}'`)) throw new Error(`Passport navigation missing ${section}`)
}
for (const publisher of ['Texas Department of Insurance','National Weather Service / NOAA','Insurance Institute for Business & Home Safety']) {
  if (!sources.includes(publisher)) throw new Error(`Citation registry missing ${publisher}`)
}
for (const table of ['property_characteristics','maintenance_items','property_documents','policy_extractions','citation_registry']) {
  if (!migration.includes(`alter table public.${table} enable row level security`)) throw new Error(`${table} must use RLS`)
}
for (const phrase of ['does not predict claims','does not determine coverage','Coming Soon','No university hail imagery']) {
  if (!report.toLowerCase().includes(phrase.toLowerCase())) throw new Error(`Required safeguard missing: ${phrase}`)
}
if (/FLIR|thermal/i.test(report)) throw new Error('Thermal/FLIR must not appear in the standard Passport')
if (!migration.includes('property_documents_immutable') || !migration.includes('policy_extractions_immutable')) throw new Error('Document versions and analyses must be immutable')
console.log('complete Passport source contract passed')
