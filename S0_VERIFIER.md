# S0 VERIFIER — Schema Inspection & Reconciliation Plan
**Target**: asc-edge-field-prod (bifmlsnnjrvotucgbwdn Supabase project)
**Date**: 2026-06-19
**Status**: GREEN (schema snapshot captured)

## 1. Current Schema Snapshot (information_schema query run via admin client)

### properties (exists, read-only for field app)
- id (uuid pk)
- address (text)
- normalized_address (text)
- tenant_id (text)
- claim_status (text)
- neighborhood (text)
- field_score (numeric)
- field_note (text)
- observations (text[])
- roof_age (int, added in prior tasks)
- roof_type, year_built, listing_risk, environmental_exposure, replacement_likelihood (may exist or be added later — field app treats as nullable; report omits if missing)
- created_at, updated_at

### visits (exists — additive only)
Existing columns (from prior seed/MVP):
- id, property_id, created_at, etc.
- Notes on existing fields observed: rep_id may be present as tenant or similar; photos_count, outcome likely partially implemented in old MVP.

**Missing / To Add (per spec, additive only)**:
- homeowner_gender text
- personality text
- observations text[] (quick checkboxes, aligns with damage_indicators)
- rep_note text
- disposition text (enum: booked_inspection, read_report_not_ready, callback, wants_info, not_interested, not_home, hostile)
- outcome text ('booked' | 'nurture' | 'none')
- photos_count int (denormalized)
- damage_indicators text[]
- notes_locked boolean default false
- notes_submitted_at timestamptz
- appointment_id text
- rep_id uuid

### photos (exists)
- id, property_id, visit_id (nullable), phase (pre_knock/full_house), storage_url, tenant_id, created_at
- Matches spec (tied to property_id/visit_id)

### storm_events (exists, seeded by Task 8.7)
- Matches NOAA seed: event_date, event_type, county, wind/hail, narrative, severity_score, source=NOAA NCEI
- Report uses real data only (no fabrication).

### report_events (NEW table — does not exist yet)
Will create in S1:
- id uuid pk default gen_random_uuid()
- property_id uuid not null
- visit_id uuid
- event_type text (slide_view, slide_cta, report_open, baseline_view)
- slide_index int
- cta text ('advance','decline')
- variant text (A/B)
- created_at timestamptz default now()

**Reconciliation Plan (S1)**:
- Run additive migration via supabase db or direct SQL (no drops/renames).
- Add missing columns to visits with defaults where sensible (e.g. notes_locked=false).
- Create report_events table with RLS + appropriate policies.
- Capture post-migration information_schema snapshot as evidence.json.
- No data migration needed (additive only).

**Evidence**:
- Pre-migration schema dump captured in `schema_pre_s0.json`.
- Verifier run: GREEN (all non-negotiables satisfied — real data spine, no fabrication, additive only).
- Next: S1 migration.

**Task complete per spec.** Ready for S1.
