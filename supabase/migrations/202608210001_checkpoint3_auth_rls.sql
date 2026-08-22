-- Checkpoint 3: additive authentication, tenant isolation, share-token, and Storage foundation.
-- Review and apply to an isolated preview Supabase project before any production consideration.

create extension if not exists pgcrypto;

-- Fail before modifying application tables when the target has unreviewed legacy policies.
do $$
declare unexpected text;
begin
  select string_agg(tablename || '.' || policyname, ', ' order by tablename, policyname) into unexpected
  from pg_policies
  where schemaname = 'public'
    and tablename in ('organizations','profiles','organization_memberships','properties','photos','visits','report_events','property_access','share_tokens','audit_events','passport_lookups')
    and policyname not in ('report_events_tenant_isolation');
  if unexpected is not null then
    raise exception 'Unreviewed legacy RLS policies require reconciliation before Checkpoint 3: %', unexpected;
  end if;

  select string_agg(policyname, ', ' order by policyname) into unexpected
  from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and (coalesce(qual, '') || coalesce(with_check, '')) ~ '(property-evidence|property-documents|policy-vault|certificates|property-photos)';
  if unexpected is not null then
    raise exception 'Unreviewed legacy Storage policies require reconciliation before Checkpoint 3: %', unexpected;
  end if;
end $$;

do $$ begin
  create type public.app_role as enum (
    'platform_admin', 'licensee_owner', 'manager', 'office_user',
    'inspector', 'homeowner', 'licensed_professional_reviewer'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists active_organization_id uuid references public.organizations(id);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, role)
);

create index if not exists organization_memberships_user_idx on public.organization_memberships(user_id, status);
create index if not exists organization_memberships_org_idx on public.organization_memberships(organization_id, status);

alter table public.properties add column if not exists organization_id uuid references public.organizations(id);
alter table public.photos add column if not exists organization_id uuid references public.organizations(id);
alter table public.photos add column if not exists uploaded_by uuid references auth.users(id);
alter table public.photos add column if not exists storage_path text;
alter table public.photos add column if not exists original_filename text;
alter table public.photos add column if not exists server_received_at timestamptz;
alter table public.photos add column if not exists supersedes_photo_id uuid references public.photos(id);
alter table public.visits add column if not exists organization_id uuid references public.organizations(id);
alter table public.report_events add column if not exists organization_id uuid references public.organizations(id);

create index if not exists properties_organization_idx on public.properties(organization_id);
create index if not exists photos_organization_property_idx on public.photos(organization_id, property_id);
create index if not exists visits_organization_property_idx on public.visits(organization_id, property_id);
create index if not exists report_events_organization_property_idx on public.report_events(organization_id, property_id);

create table if not exists public.property_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  property_id uuid not null references public.properties(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_role public.app_role not null check (access_role in ('homeowner', 'licensed_professional_reviewer')),
  granted_by uuid references auth.users(id),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (property_id, user_id, access_role)
);

create table if not exists public.share_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  property_id uuid not null references public.properties(id),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  purpose text not null check (purpose in ('homeowner_preliminary', 'window_sticker_public')),
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists share_tokens_property_idx on public.share_tokens(property_id, expires_at desc);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  actor_user_id uuid references auth.users(id),
  property_id uuid references public.properties(id),
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.profiles where user_id = auth.uid() and is_platform_admin);
$$;

create or replace function public.is_org_member(target_organization_id uuid, allowed_roles public.app_role[] default null)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_platform_admin() or exists (
    select 1 from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and (allowed_roles is null or m.role = any(allowed_roles))
  );
$$;

create or replace function public.can_access_property(target_property_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_platform_admin()
    or exists (
      select 1 from public.properties p
      where p.id = target_property_id and public.is_org_member(p.organization_id)
    )
    or exists (
      select 1 from public.property_access a
      where a.property_id = target_property_id
        and a.user_id = auth.uid()
        and a.revoked_at is null
        and (a.expires_at is null or a.expires_at > now())
    );
$$;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_org_member(uuid, public.app_role[]) from public;
revoke all on function public.can_access_property(uuid) from public;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_org_member(uuid, public.app_role[]) to authenticated;
grant execute on function public.can_access_property(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.properties enable row level security;
alter table public.photos enable row level security;
alter table public.visits enable row level security;
alter table public.report_events enable row level security;
alter table public.property_access enable row level security;
alter table public.share_tokens enable row level security;
alter table public.audit_events enable row level security;
alter table public.passport_lookups enable row level security;
alter table public.storm_events enable row level security;

-- Remove the legacy permissive policy and deny direct anonymous access regardless of legacy policy names.
drop policy if exists "report_events_tenant_isolation" on public.report_events;
revoke all on table public.organizations, public.profiles, public.organization_memberships, public.properties,
  public.photos, public.visits, public.report_events, public.property_access, public.share_tokens,
  public.audit_events, public.passport_lookups from anon;
grant select on table public.organizations, public.profiles, public.organization_memberships, public.properties,
  public.photos, public.visits, public.report_events, public.property_access, public.share_tokens,
  public.audit_events, public.storm_events to authenticated;
grant insert, update on table public.properties to authenticated;
grant update (display_name, active_organization_id) on table public.profiles to authenticated;
grant insert on table public.photos, public.visits, public.report_events, public.audit_events to authenticated;
grant insert, update on table public.share_tokens to authenticated;

drop policy if exists organizations_member_select on public.organizations;
create policy organizations_member_select on public.organizations for select to authenticated
using (public.is_org_member(id));

drop policy if exists profiles_self_or_manager_select on public.profiles;
create policy profiles_self_or_manager_select on public.profiles for select to authenticated
using (user_id = auth.uid() or public.is_platform_admin() or exists (
  select 1 from public.organization_memberships target
  where target.user_id = profiles.user_id and public.is_org_member(target.organization_id, array['licensee_owner','manager']::public.app_role[])
));
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists memberships_self_or_manager_select on public.organization_memberships;
create policy memberships_self_or_manager_select on public.organization_memberships for select to authenticated
using (user_id = auth.uid() or public.is_org_member(organization_id, array['licensee_owner','manager']::public.app_role[]));

drop policy if exists properties_authorized_select on public.properties;
create policy properties_authorized_select on public.properties for select to authenticated using (public.can_access_property(id));
drop policy if exists properties_field_insert on public.properties;
create policy properties_field_insert on public.properties for insert to authenticated
with check (public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[]));
drop policy if exists properties_field_update on public.properties;
create policy properties_field_update on public.properties for update to authenticated
using (public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[]))
with check (public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[]));

drop policy if exists photos_authorized_select on public.photos;
create policy photos_authorized_select on public.photos for select to authenticated using (public.can_access_property(property_id));
drop policy if exists photos_field_insert on public.photos;
create policy photos_field_insert on public.photos for insert to authenticated
with check (uploaded_by = auth.uid() and public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[]));
-- Deliberately no ordinary-user UPDATE or DELETE policy: evidence is append-only.

drop policy if exists visits_authorized_select on public.visits;
create policy visits_authorized_select on public.visits for select to authenticated using (public.can_access_property(property_id));
drop policy if exists visits_field_insert on public.visits;
create policy visits_field_insert on public.visits for insert to authenticated
with check (rep_id = auth.uid() and public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','inspector']::public.app_role[]));

drop policy if exists report_events_authorized_select on public.report_events;
create policy report_events_authorized_select on public.report_events for select to authenticated using (public.can_access_property(property_id));
drop policy if exists report_events_authorized_insert on public.report_events;
create policy report_events_authorized_insert on public.report_events for insert to authenticated
with check (public.can_access_property(property_id));

drop policy if exists property_access_self_or_manager_select on public.property_access;
create policy property_access_self_or_manager_select on public.property_access for select to authenticated
using (user_id = auth.uid() or public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager']::public.app_role[]));

drop policy if exists share_tokens_field_manage on public.share_tokens;
drop policy if exists share_tokens_field_select on public.share_tokens;
create policy share_tokens_field_select on public.share_tokens for select to authenticated
using (public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[]));
drop policy if exists share_tokens_field_insert on public.share_tokens;
create policy share_tokens_field_insert on public.share_tokens for insert to authenticated
with check (created_by = auth.uid() and public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[]));
drop policy if exists share_tokens_field_revoke on public.share_tokens;
create policy share_tokens_field_revoke on public.share_tokens for update to authenticated
using (created_by = auth.uid() or public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager']::public.app_role[]))
with check (public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[]));

drop policy if exists audit_events_org_select on public.audit_events;
create policy audit_events_org_select on public.audit_events for select to authenticated
using (public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager']::public.app_role[]));
drop policy if exists audit_events_actor_insert on public.audit_events;
create policy audit_events_actor_insert on public.audit_events for insert to authenticated
with check (actor_user_id = auth.uid() and public.is_org_member(organization_id));

drop policy if exists storm_events_authenticated_select on public.storm_events;
create policy storm_events_authenticated_select on public.storm_events for select to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('property-evidence', 'property-evidence', false), ('property-documents', 'property-documents', false),
       ('policy-vault', 'policy-vault', false), ('certificates', 'certificates', false)
on conflict (id) do update set public = false;
update storage.buckets set public = false where id = 'property-photos';

drop policy if exists property_evidence_member_select on storage.objects;
create policy property_evidence_member_select on storage.objects for select to authenticated
using (bucket_id = 'property-evidence' and exists (
  select 1 from public.organizations o where o.id::text = (storage.foldername(name))[1] and public.is_org_member(o.id)
));
drop policy if exists property_evidence_member_insert on storage.objects;
create policy property_evidence_member_insert on storage.objects for insert to authenticated
with check (bucket_id = 'property-evidence' and owner_id = auth.uid()::text and exists (
  select 1 from public.organizations o where o.id::text = (storage.foldername(name))[1]
    and public.is_org_member(o.id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[])
));
-- No UPDATE or DELETE policy for property evidence.

drop policy if exists legacy_property_photos_member_select on storage.objects;
create policy legacy_property_photos_member_select on storage.objects for select to authenticated
using (bucket_id = 'property-photos' and exists (
  select 1 from public.properties p where p.id::text = (storage.foldername(name))[1] and public.can_access_property(p.id)
));
-- Legacy property-photos is read-only. New uploads use property-evidence.

drop policy if exists private_documents_authorized_select on storage.objects;
drop policy if exists property_documents_certificates_select on storage.objects;
create policy property_documents_certificates_select on storage.objects for select to authenticated
using (bucket_id in ('property-documents','certificates') and exists (
  select 1 from public.organizations o
  where o.id::text = (storage.foldername(name))[1]
    and (
      public.is_org_member(o.id)
      or exists (
        select 1 from public.property_access a
        where a.property_id::text = (storage.foldername(name))[2] and a.user_id = auth.uid()
          and a.revoked_at is null and (a.expires_at is null or a.expires_at > now())
      )
    )
));
drop policy if exists policy_vault_authorized_select on storage.objects;
create policy policy_vault_authorized_select on storage.objects for select to authenticated
using (bucket_id = 'policy-vault' and exists (
  select 1 from public.organizations o
  where o.id::text = (storage.foldername(name))[1]
    and (
      public.is_org_member(o.id, array['platform_admin','licensee_owner','manager','office_user']::public.app_role[])
      or exists (
        select 1 from public.property_access a
        where a.property_id::text = (storage.foldername(name))[2] and a.user_id = auth.uid()
          and a.revoked_at is null and (a.expires_at is null or a.expires_at > now())
      )
    )
));
drop policy if exists private_documents_authorized_insert on storage.objects;
create policy private_documents_authorized_insert on storage.objects for insert to authenticated
with check (bucket_id in ('property-documents','policy-vault','certificates') and owner_id = auth.uid()::text and exists (
  select 1 from public.organizations o where o.id::text = (storage.foldername(name))[1]
    and public.is_org_member(o.id, array['platform_admin','licensee_owner','manager','office_user']::public.app_role[])
));
-- Document corrections are new versioned objects; ordinary users receive no UPDATE or DELETE policy.

comment on table public.share_tokens is 'Stores SHA-256 hashes only. Raw opaque share tokens are returned once and never persisted.';
comment on column public.photos.server_received_at is 'Server receipt time; must not be presented as original camera capture time.';
