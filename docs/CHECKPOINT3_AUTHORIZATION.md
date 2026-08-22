# Checkpoint 3 authentication and authorization

## Boundaries

- Field pages and mutation routes require a verified Supabase Auth user and an active field membership.
- Authorization is checked in each page or route handler; `proxy.ts` refreshes sessions but is not the authorization boundary.
- Tenant access is derived from `organization_memberships`, never from a client-provided tenant identifier.
- Property access is enforced by both application checks and database Row Level Security.
- Homeowner links contain 256-bit random tokens. Only SHA-256 hashes are stored in `share_tokens`.
- Shared Passport resolution is the narrow server-only exception that uses the service role.
- Evidence and document buckets are private. Authorized clients receive short-lived signed URLs.
- Evidence objects and photo rows have no ordinary-user update/delete policies.

## Preview application sequence

1. Capture the target preview project's schema, grants, policies, and Storage configuration.
2. Review the additive migration against that capture, especially legacy policy names and required legacy columns.
3. Apply `supabase/migrations/202608210001_checkpoint3_auth_rls.sql` only to the isolated preview project.
4. Create two test organizations and individual test users through approved administrative provisioning.
5. Assign representative A only to organization A and representative B only to organization B.
6. Backfill `organization_id` for preview fixture rows before exercising the field application.
7. Run `supabase/tests/checkpoint3_rls_contract.sql`.
8. Execute the runtime tenant-isolation matrix below with user-scoped clients.

## Runtime tenant-isolation matrix

For each operation, verify same-tenant success and cross-tenant denial:

- Read property
- Update property observations
- Upload evidence
- Read evidence/signed URL
- Insert visit
- Insert report event
- Create and revoke share token
- Read policy/document metadata
- Subscribe to tenant-scoped Realtime changes when enabled later

Also verify:

- Anonymous direct table and Storage requests are denied.
- Homeowner opaque links expose only the intended preliminary projection.
- Expired and revoked tokens return not found.
- Raw property UUID report routes require a field account.
- A licensed-professional reviewer cannot access properties or documents without an explicit grant.

Runtime evidence cannot be produced from a checkout without an isolated Supabase runtime. Do not treat lint, type checking, builds, or SQL contract inspection as a substitute for the matrix above.
