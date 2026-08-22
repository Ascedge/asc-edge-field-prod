# Checkpoint 4 — Flagship workflow

This checkpoint implements the 14307 workflow in source without applying a migration or deploying an environment.

## State machine

`preliminary` → `awaiting_homeowner_authorization` → `authorized` → `documentation_in_progress` → `documentation_complete`

`published` and `annual_update_due` are modeled now but remain future transitions. A decline preserves the preliminary record and keeps full documentation locked.

## Evidence rules

- Preliminary and full images store organization, property, uploader, server receipt time, phase, category, caption, original filename, SHA-256 file hash, upload event ID, and report version.
- File hashes describe received bytes. They do not prove camera time or GPS metadata.
- Photo, authorization, and timeline rows have database mutation guards. Corrections must append a superseding record.
- Inspection/documentation consent is versioned and separate from marketing/media and policy-vault permissions.
- The public Passport projection never returns the property UUID.

## Live behavior

The homeowner Passport refreshes its narrow token-scoped projection every five seconds. The migration also adds the relevant tables to Supabase Realtime so a preview environment can replace or augment polling after connection testing.

## Preview verification required

Apply Checkpoints 3 and 4 to an isolated preview Supabase project, seed two organizations, and prove:

1. A representative can upload preliminary evidence.
2. Full evidence returns 403 before approval.
3. Approval captures version, name, decision, server time, request evidence, representative, scope, and affirmative evidence.
4. Full evidence succeeds after approval and appears through the same opaque token.
5. Decline leaves full evidence locked.
6. A second tenant cannot read or mutate the property, evidence, consent, or timeline.
7. UPDATE and DELETE attempts against evidence, consent, and timeline fail even for ordinary authenticated users.
8. Completion fails below 20 full images and succeeds at 20.

No runtime claim is made until those tests run against the isolated preview database.
