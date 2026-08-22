-- P0 recovery: durable public Passport, exact canonical properties, auditable roof measurements.
-- Apply only to the isolated 14307 preview project. Never apply directly to production.

alter type public.report_status add value if not exists 'access_revoked';

alter table public.properties add column if not exists created_by uuid references auth.users(id);
alter table public.properties add column if not exists canonical_street text;
alter table public.properties add column if not exists city text;
alter table public.properties add column if not exists state text;
alter table public.properties add column if not exists postal_code text;
alter table public.properties add column if not exists county text;
alter table public.properties add column if not exists latitude numeric(10,7);
alter table public.properties add column if not exists longitude numeric(10,7);
alter table public.properties add column if not exists canonical_place_id text;
alter table public.properties add column if not exists parcel_id text;
alter table public.properties add column if not exists address_verification_source text;
alter table public.properties add column if not exists address_verified_at timestamptz;

alter table public.share_tokens alter column expires_at drop not null;
alter table public.share_tokens add column if not exists token_ciphertext text;
alter table public.share_tokens add column if not exists revocation_reason text;
alter table public.share_tokens add column if not exists replaced_by uuid references public.share_tokens(id);

alter table public.photos add column if not exists homeowner_visible boolean not null default true;
alter table public.property_timeline_events add column if not exists homeowner_visible boolean not null default true;

create table if not exists public.property_measurements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  property_id uuid not null references public.properties(id),
  source text not null check (source in ('google_solar','county_appraisal','licensed_property_data','visual_analysis','field_review')),
  provider_record_id text,
  matched_latitude numeric(10,7),
  matched_longitude numeric(10,7),
  retrieved_at timestamptz not null,
  coverage_status text not null,
  confidence text not null,
  roof_area_sq_m numeric(12,4),
  roof_area_sq_ft numeric(12,2),
  roof_squares numeric(10,2),
  roof_segments jsonb not null default '[]'::jsonb,
  limitations text not null,
  raw_provider_response jsonb,
  evidence_reference text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.property_measurement_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  property_id uuid not null references public.properties(id),
  measurement_id uuid not null references public.property_measurements(id),
  original_roof_squares numeric(10,2) not null,
  revised_roof_squares numeric(10,2) not null,
  reason text not null,
  supporting_evidence text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists property_measurements_property_idx
  on public.property_measurements(property_id, retrieved_at desc);
create index if not exists property_measurement_overrides_property_idx
  on public.property_measurement_overrides(property_id, created_at desc);

alter table public.property_measurements enable row level security;
alter table public.property_measurement_overrides enable row level security;
revoke all on table public.property_measurements, public.property_measurement_overrides from anon;
grant select, insert on table public.property_measurements, public.property_measurement_overrides to authenticated;

drop policy if exists property_measurements_member_select on public.property_measurements;
create policy property_measurements_member_select on public.property_measurements for select to authenticated
using (public.can_access_property(property_id));
drop policy if exists property_measurements_field_insert on public.property_measurements;
create policy property_measurements_field_insert on public.property_measurements for insert to authenticated
with check (
  created_by = auth.uid()
  and public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[])
);
drop policy if exists property_measurement_overrides_member_select on public.property_measurement_overrides;
create policy property_measurement_overrides_member_select on public.property_measurement_overrides for select to authenticated
using (public.can_access_property(property_id));
drop policy if exists property_measurement_overrides_field_insert on public.property_measurement_overrides;
create policy property_measurement_overrides_field_insert on public.property_measurement_overrides for insert to authenticated
with check (
  created_by = auth.uid()
  and public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[])
);

drop trigger if exists property_measurements_immutable on public.property_measurements;
create trigger property_measurements_immutable before update or delete on public.property_measurements
for each row execute function public.prevent_evidence_mutation();
drop trigger if exists property_measurement_overrides_immutable on public.property_measurement_overrides;
create trigger property_measurement_overrides_immutable before update or delete on public.property_measurement_overrides
for each row execute function public.prevent_evidence_mutation();

-- Property creation always records the authenticated creator and the creator's active tenant.
drop policy if exists properties_field_insert on public.properties;
create policy properties_field_insert on public.properties for insert to authenticated
with check (
  created_by = auth.uid()
  and tenant_id = organization_id::text
  and public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[])
);

-- Public reads are possible only through this token-scoped, explicitly allowlisted function.
-- No internal observations, policy-vault records, tenant records, or documents are returned.
create or replace function public.resolve_public_passport(submitted_token_hash text)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  with valid_share as (
    select s.id, s.property_id, s.expires_at
    from public.share_tokens s
    where s.token_hash = submitted_token_hash
      and s.purpose = 'homeowner_preliminary'
      and s.revoked_at is null
      and (s.expires_at is null or s.expires_at > now())
    limit 1
  ), latest_authorization as (
    select a.property_id, a.decision, a.created_at
    from public.property_authorizations a join valid_share s on s.property_id = a.property_id
    where a.authorization_type = 'inspection_documentation'
    order by a.created_at desc limit 1
  ), latest_measurement as (
    select m.* from public.property_measurements m join valid_share s on s.property_id = m.property_id
    order by m.retrieved_at desc limit 1
  )
  select jsonb_build_object(
    'shareId', s.id, 'propertyId', p.id, 'expiresAt', s.expires_at,
    'address', p.address, 'canonicalStreet', p.canonical_street, 'city', p.city,
    'state', p.state, 'postalCode', p.postal_code, 'county', p.county,
    'latitude', p.latitude, 'longitude', p.longitude, 'neighborhood', p.neighborhood,
    'status', p.report_status,
    'authorization', case when a.property_id is null then null else jsonb_build_object('decision',a.decision,'decidedAt',a.created_at) end,
    'photos', coalesce((select jsonb_agg(jsonb_build_object(
      'id',ph.id,'storagePath',ph.storage_path,'storageUrl',ph.storage_url,'phase',ph.phase,
      'category',ph.category,'caption',ph.caption,'createdAt',ph.created_at) order by ph.created_at)
      from public.photos ph where ph.property_id = p.id and ph.homeowner_visible
        and (coalesce(a.decision,'') = 'approved' or ph.phase = 'pre_knock')), '[]'::jsonb),
    'timeline', coalesce((select jsonb_agg(jsonb_build_object(
      'id',e.id,'eventType',e.event_type,'status',e.report_status,'summary',e.summary,'createdAt',e.created_at) order by e.created_at)
      from public.property_timeline_events e where e.property_id = p.id and e.homeowner_visible), '[]'::jsonb),
    'measurement', case when m.id is null then null else jsonb_build_object(
      'source',m.source,'providerRecordId',m.provider_record_id,'retrievedAt',m.retrieved_at,
      'coverageStatus',m.coverage_status,'confidence',m.confidence,'roofSquares',m.roof_squares,
      'limitations',m.limitations) end
  )
  from valid_share s join public.properties p on p.id = s.property_id
  left join latest_authorization a on a.property_id = p.id
  left join latest_measurement m on m.property_id = p.id;
$$;
revoke all on function public.resolve_public_passport(text) from public;
grant execute on function public.resolve_public_passport(text) to anon, authenticated;

-- Homeowner authorization remains narrowly token-scoped but no longer requires a universal admin client.
create or replace function public.record_homeowner_authorization(
  submitted_token_hash text, submitted_homeowner_name text, submitted_decision text,
  submitted_ip inet, submitted_user_agent text
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare token_row public.share_tokens%rowtype; authorization_id uuid; prior_id uuid; next_status public.report_status;
begin
  if submitted_decision not in ('approved','declined') then raise exception 'Invalid authorization decision'; end if;
  if length(trim(submitted_homeowner_name)) < 2 or length(trim(submitted_homeowner_name)) > 120 then
    raise exception 'Homeowner name must be between 2 and 120 characters';
  end if;
  select * into token_row from public.share_tokens where token_hash = submitted_token_hash
    and purpose = 'homeowner_preliminary' and revoked_at is null
    and (expires_at is null or expires_at > now()) for update;
  if not found then raise exception 'Invalid, expired, or revoked Passport link'; end if;
  select id into prior_id from public.property_authorizations where property_id = token_row.property_id
    and authorization_type = 'inspection_documentation' order by created_at desc limit 1;
  insert into public.property_authorizations (
    organization_id, property_id, share_token_id, authorization_type, authorization_version,
    decision, homeowner_name, scope_text, affirmative_consent, representative_user_id,
    ip_address, user_agent, evidence, supersedes_authorization_id
  ) values (
    token_row.organization_id, token_row.property_id, token_row.id, 'inspection_documentation', '2026-08-22-v2',
    submitted_decision, trim(submitted_homeowner_name),
    'Ground-level exterior inspection and photographic documentation for this Roof Passport. Marketing/media and policy-vault permissions are not included.',
    submitted_decision = 'approved', token_row.created_by, submitted_ip, left(submitted_user_agent,500),
    jsonb_build_object('method','affirmative_checkbox_and_button','server_received_at',now()), prior_id
  ) returning id into authorization_id;
  next_status := case when submitted_decision = 'approved' then 'authorized'::public.report_status
    else 'awaiting_homeowner_authorization'::public.report_status end;
  update public.properties set report_status = next_status where id = token_row.property_id;
  insert into public.property_timeline_events (
    organization_id, property_id, event_type, report_status, source_type, source_id, summary, metadata, homeowner_visible
  ) values (
    token_row.organization_id, token_row.property_id, 'homeowner_authorization', next_status,
    'property_authorization', authorization_id,
    case when submitted_decision = 'approved' then 'Homeowner authorized full property documentation.'
      else 'Homeowner declined full property documentation; preliminary record preserved.' end,
    jsonb_build_object('decision',submitted_decision,'authorization_version','2026-08-22-v2'), true
  );
  return authorization_id;
end $$;
revoke all on function public.record_homeowner_authorization(text,text,text,inet,text) from public;
grant execute on function public.record_homeowner_authorization(text,text,text,inet,text) to anon, authenticated;

comment on column public.share_tokens.token_ciphertext is 'Optional AES-GCM encrypted raw token used only to redisplay the same durable link to authorized staff.';
comment on table public.property_measurements is 'Append-only provider and field measurement evidence; raw provider responses are retained for audit.';
