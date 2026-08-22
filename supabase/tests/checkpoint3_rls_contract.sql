-- Run after the Checkpoint 3 migration in an isolated preview project.
-- This contract test fails if critical RLS/table/bucket declarations are absent.

do $$
declare missing_count integer;
begin
  select count(*) into missing_count
  from (values ('organizations'), ('profiles'), ('organization_memberships'), ('properties'), ('photos'),
               ('visits'), ('report_events'), ('property_access'), ('share_tokens'), ('audit_events')) expected(table_name)
  where not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = expected.table_name and c.relrowsecurity
  );
  if missing_count <> 0 then raise exception 'Checkpoint 3 RLS is missing on % required tables', missing_count; end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename in ('properties','photos','visits','report_events','share_tokens')
      and ('anon' = any(roles) or 'public' = any(roles))
  ) then raise exception 'Anonymous/public policy found on a private Checkpoint 3 table'; end if;

  if (select count(*) from storage.buckets where id in ('property-evidence','property-documents','policy-vault','certificates') and public = false) <> 4
  then raise exception 'Required private Storage buckets are missing or public'; end if;
end $$;
