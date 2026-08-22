-- Checkpoint 4: authorization state machine, immutable evidence metadata, and live Passport support.
-- Apply only after Checkpoint 3 in an isolated preview project. Do not apply directly to production.

do $$ begin
  create type public.report_status as enum (
    'preliminary', 'awaiting_homeowner_authorization', 'authorized',
    'documentation_in_progress', 'documentation_complete', 'published', 'annual_update_due'
  );
exception when duplicate_object then null;
end $$;

alter table public.properties add column if not exists report_status public.report_status not null default 'preliminary';
alter table public.properties add column if not exists report_version integer not null default 1 check (report_version > 0);
alter table public.photos add column if not exists category text;
alter table public.photos add column if not exists caption text;
alter table public.photos add column if not exists file_hash text check (file_hash is null or file_hash ~ '^[0-9a-f]{64}$');
alter table public.photos add column if not exists report_version integer not null default 1 check (report_version > 0);
alter table public.photos add column if not exists upload_event_id uuid;

create table if not exists public.property_authorizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  property_id uuid not null references public.properties(id),
  share_token_id uuid not null references public.share_tokens(id),
  authorization_type text not null check (authorization_type in ('inspection_documentation','marketing_media','contractor_policy_vault')),
  authorization_version text not null,
  decision text not null check (decision in ('approved','declined','revoked')),
  homeowner_name text not null,
  scope_text text not null,
  affirmative_consent boolean not null,
  representative_user_id uuid references auth.users(id),
  ip_address inet,
  user_agent text,
  evidence jsonb not null default '{}'::jsonb,
  supersedes_authorization_id uuid references public.property_authorizations(id),
  created_at timestamptz not null default now()
);

create index if not exists property_authorizations_property_idx
  on public.property_authorizations(property_id, authorization_type, created_at desc);

create table if not exists public.property_timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  property_id uuid not null references public.properties(id),
  event_type text not null,
  report_status public.report_status,
  actor_user_id uuid references auth.users(id),
  source_type text not null,
  source_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists property_timeline_property_idx
  on public.property_timeline_events(property_id, created_at, id);

-- Replace the Checkpoint 3 insert rule so direct Supabase calls cannot bypass homeowner approval.
drop policy if exists photos_field_insert on public.photos;
create policy photos_field_insert on public.photos for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[])
  and (
    phase <> 'full_house'
    or (select decision from public.property_authorizations a
        where a.property_id = photos.property_id and a.authorization_type = 'inspection_documentation'
        order by a.created_at desc limit 1) = 'approved'
  )
);

alter table public.property_authorizations enable row level security;
alter table public.property_timeline_events enable row level security;
revoke all on table public.property_authorizations, public.property_timeline_events from anon;
grant select on table public.property_authorizations, public.property_timeline_events to authenticated;
grant insert on table public.property_timeline_events to authenticated;

drop policy if exists property_authorizations_authorized_select on public.property_authorizations;
create policy property_authorizations_authorized_select on public.property_authorizations for select to authenticated
using (public.can_access_property(property_id));
-- Consent writes occur only through the narrowly scoped security-definer function below.

drop policy if exists property_timeline_authorized_select on public.property_timeline_events;
create policy property_timeline_authorized_select on public.property_timeline_events for select to authenticated
using (public.can_access_property(property_id));
drop policy if exists property_timeline_field_insert on public.property_timeline_events;
create policy property_timeline_field_insert on public.property_timeline_events for insert to authenticated
with check (actor_user_id = auth.uid() and public.is_org_member(organization_id));
-- Timeline events are append-only: no UPDATE or DELETE grants or policies.

create or replace function public.record_homeowner_authorization(
  submitted_token_hash text,
  submitted_homeowner_name text,
  submitted_decision text,
  submitted_ip inet,
  submitted_user_agent text
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  token_row public.share_tokens%rowtype;
  property_row public.properties%rowtype;
  authorization_id uuid;
  prior_id uuid;
  next_status public.report_status;
begin
  if submitted_decision not in ('approved', 'declined') then raise exception 'Invalid authorization decision'; end if;
  if length(trim(submitted_homeowner_name)) < 2 or length(trim(submitted_homeowner_name)) > 120 then
    raise exception 'Homeowner name must be between 2 and 120 characters';
  end if;

  select * into token_row from public.share_tokens
  where token_hash = submitted_token_hash and purpose = 'homeowner_preliminary'
    and revoked_at is null and expires_at > now()
  for update;
  if not found then raise exception 'Invalid or expired Passport link'; end if;

  select * into property_row from public.properties where id = token_row.property_id for update;
  select id into prior_id from public.property_authorizations
    where property_id = token_row.property_id and authorization_type = 'inspection_documentation'
    order by created_at desc limit 1;

  insert into public.property_authorizations (
    organization_id, property_id, share_token_id, authorization_type, authorization_version,
    decision, homeowner_name, scope_text, affirmative_consent, representative_user_id,
    ip_address, user_agent, evidence, supersedes_authorization_id
  ) values (
    token_row.organization_id, token_row.property_id, token_row.id, 'inspection_documentation', '2026-08-21-v1',
    submitted_decision, trim(submitted_homeowner_name),
    'Ground-level exterior inspection and photographic documentation for this Roof Passport. Marketing/media and policy-vault permissions are not included.',
    submitted_decision = 'approved', token_row.created_by, submitted_ip, left(submitted_user_agent, 500),
    jsonb_build_object('method','affirmative_checkbox_and_button','server_received_at',now()), prior_id
  ) returning id into authorization_id;

  next_status := case when submitted_decision = 'approved' then 'authorized'::public.report_status
                      else 'awaiting_homeowner_authorization'::public.report_status end;
  update public.properties set report_status = next_status where id = token_row.property_id;
  insert into public.property_timeline_events (
    organization_id, property_id, event_type, report_status, source_type, source_id, summary, metadata
  ) values (
    token_row.organization_id, token_row.property_id, 'homeowner_authorization', next_status,
    'property_authorization', authorization_id,
    case when submitted_decision = 'approved' then 'Homeowner authorized full property documentation.'
         else 'Homeowner declined full property documentation; preliminary record preserved.' end,
    jsonb_build_object('decision', submitted_decision, 'authorization_version', '2026-08-21-v1')
  );
  return authorization_id;
end $$;

revoke all on function public.record_homeowner_authorization(text,text,text,inet,text) from public;
grant execute on function public.record_homeowner_authorization(text,text,text,inet,text) to service_role;

create or replace function public.prevent_evidence_mutation()
returns trigger language plpgsql as $$ begin
  raise exception 'Evidence and timeline records are immutable; append a superseding record instead';
end $$;

drop trigger if exists photos_immutable on public.photos;
create trigger photos_immutable before update or delete on public.photos
for each row execute function public.prevent_evidence_mutation();
drop trigger if exists authorizations_immutable on public.property_authorizations;
create trigger authorizations_immutable before update or delete on public.property_authorizations
for each row execute function public.prevent_evidence_mutation();
drop trigger if exists timeline_immutable on public.property_timeline_events;
create trigger timeline_immutable before update or delete on public.property_timeline_events
for each row execute function public.prevent_evidence_mutation();

create or replace function public.enforce_report_status_transition()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare latest_decision text; full_count integer;
begin
  if new.report_status = old.report_status then return new; end if;
  select decision into latest_decision from public.property_authorizations
    where property_id = new.id and authorization_type = 'inspection_documentation'
    order by created_at desc limit 1;
  if new.report_status in ('authorized','documentation_in_progress') and latest_decision is distinct from 'approved' then
    raise exception 'Approved homeowner authorization is required for this report status';
  end if;
  if new.report_status = 'documentation_complete' then
    select count(*) into full_count from public.photos where property_id = new.id and phase = 'full_house';
    if latest_decision is distinct from 'approved' or full_count < 20 then
      raise exception 'Approved authorization and at least 20 full documentation images are required';
    end if;
  end if;
  if new.report_status = 'published' and old.report_status <> 'documentation_complete' then
    raise exception 'Only complete documentation can be published';
  end if;
  if new.report_status = 'annual_update_due' and old.report_status <> 'published' then
    raise exception 'Only a published Passport can become due for annual update';
  end if;
  return new;
end $$;

drop trigger if exists properties_status_transition_guard on public.properties;
create trigger properties_status_transition_guard before update of report_status on public.properties
for each row execute function public.enforce_report_status_transition();

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'photos') then
    alter publication supabase_realtime add table public.photos;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'property_timeline_events') then
    alter publication supabase_realtime add table public.property_timeline_events;
  end if;
end $$;

comment on column public.photos.file_hash is 'SHA-256 of uploaded bytes; not camera metadata.';
comment on table public.property_authorizations is 'Append-only consent evidence. Marketing and policy-vault permission are separate authorization types.';
