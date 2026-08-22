# Supabase service-role key rotation checklist

The previously committed service-role credential must be treated as exposed. Removing the fallback from the current source does not remove it from Git history and does not make it safe to reuse.

This checklist is intentionally non-executable. Rotation requires a separately approved, coordinated maintenance task.

1. Identify every environment and integration using the Supabase project.
2. Inventory Development, Preview, and Production variable names without printing their values.
3. Confirm the hardcoded fallback is absent from current source, fixtures, logs, and build artifacts.
4. Generate a replacement service-role credential in Supabase.
5. Update authorized server environments only; never expose it through a `NEXT_PUBLIC_` variable.
6. Deploy and validate an isolated preview using the replacement credential.
7. Update production during an approved maintenance window with a documented rollback owner.
8. Revoke the exposed credential after every legitimate consumer has migrated.
9. Verify that the revoked credential is rejected and the replacement remains server-only.
10. Review available Supabase audit logs for unexpected service-role activity.
11. Record the rotation owner, timestamps, validation evidence, and any follow-up actions.

Do not rewrite repository history as part of routine application work. Any history-remediation decision requires separate coordination because it affects every clone and downstream reference.
