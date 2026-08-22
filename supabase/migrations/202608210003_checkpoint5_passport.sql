-- Checkpoint 5: additive Passport content, documents, maintenance, certificates, and citation registry.
-- Review and apply only to an isolated preview project after Checkpoints 3 and 4.

create table if not exists public.property_characteristics (
  property_id uuid primary key references public.properties(id), organization_id uuid not null references public.organizations(id),
  roof_covering text, roof_age_years integer check (roof_age_years between 0 and 200), stories numeric(3,1),
  footprint_sqft numeric(10,2), roof_pitch_multiplier numeric(5,3), waste_factor numeric(5,3),
  estimate_notes text, updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
create table if not exists public.maintenance_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  property_id uuid not null references public.properties(id), title text not null, observation text,
  status text not null default 'identified' check (status in ('identified','quoted','authorized','completed','deferred')),
  estimated_price numeric(12,2), price_basis text, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  property_id uuid not null references public.properties(id), document_type text not null,
  title text not null, storage_bucket text not null check (storage_bucket in ('property-documents','policy-vault','certificates')),
  storage_path text not null, version integer not null default 1, year integer, uploaded_by uuid references auth.users(id),
  supersedes_document_id uuid references public.property_documents(id), created_at timestamptz not null default now()
);
create table if not exists public.policy_extractions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  property_id uuid not null references public.properties(id), document_id uuid not null references public.property_documents(id),
  extracted_facts jsonb not null default '{}'::jsonb, discrepancy_summary text,
  review_status text not null default 'professional_review_required', model_version text, created_at timestamptz not null default now()
);
create table if not exists public.citation_registry (
  id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id), property_id uuid references public.properties(id),
  claim_supported text not null, publisher text not null, title text not null, url text not null,
  publication_date date, access_date date not null, report_sections text[] not null default '{}', created_at timestamptz not null default now()
);

create index if not exists maintenance_items_property_idx on public.maintenance_items(property_id, created_at);
create index if not exists property_documents_property_idx on public.property_documents(property_id, document_type, year desc, version desc);
create index if not exists policy_extractions_property_idx on public.policy_extractions(property_id, created_at desc);
create index if not exists citation_registry_property_idx on public.citation_registry(property_id, publisher);

alter table public.property_characteristics enable row level security;
alter table public.maintenance_items enable row level security;
alter table public.property_documents enable row level security;
alter table public.policy_extractions enable row level security;
alter table public.citation_registry enable row level security;
revoke all on table public.property_characteristics, public.maintenance_items, public.property_documents, public.policy_extractions, public.citation_registry from anon;
grant select on table public.property_characteristics, public.maintenance_items, public.property_documents, public.policy_extractions, public.citation_registry to authenticated;
grant insert, update on table public.property_characteristics, public.maintenance_items to authenticated;
grant insert on table public.property_documents, public.policy_extractions, public.citation_registry to authenticated;

drop policy if exists passport_characteristics_select on public.property_characteristics;
create policy passport_characteristics_select on public.property_characteristics for select to authenticated using (public.can_access_property(property_id));
drop policy if exists passport_characteristics_write on public.property_characteristics;
create policy passport_characteristics_write on public.property_characteristics for all to authenticated
using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
drop policy if exists maintenance_authorized_select on public.maintenance_items;
create policy maintenance_authorized_select on public.maintenance_items for select to authenticated using (public.can_access_property(property_id));
drop policy if exists maintenance_field_write on public.maintenance_items;
create policy maintenance_field_write on public.maintenance_items for all to authenticated
using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
drop policy if exists property_documents_authorized_select on public.property_documents;
create policy property_documents_authorized_select on public.property_documents for select to authenticated using (public.can_access_property(property_id));
drop policy if exists property_documents_field_insert on public.property_documents;
create policy property_documents_field_insert on public.property_documents for insert to authenticated
with check (uploaded_by = auth.uid() and public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user']::public.app_role[]));
drop policy if exists policy_extractions_authorized_select on public.policy_extractions;
create policy policy_extractions_authorized_select on public.policy_extractions for select to authenticated using (public.can_access_property(property_id));
drop policy if exists policy_extractions_office_insert on public.policy_extractions;
create policy policy_extractions_office_insert on public.policy_extractions for insert to authenticated
with check (public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user']::public.app_role[]));
drop policy if exists citations_authorized_select on public.citation_registry;
create policy citations_authorized_select on public.citation_registry for select to authenticated using (property_id is null or public.can_access_property(property_id));
drop policy if exists citations_office_insert on public.citation_registry;
create policy citations_office_insert on public.citation_registry for insert to authenticated
with check (organization_id is null or public.is_org_member(organization_id, array['platform_admin','licensee_owner','manager','office_user']::public.app_role[]));

-- Documents and derived analyses are versioned append-only records.
drop trigger if exists property_documents_immutable on public.property_documents;
create trigger property_documents_immutable before update or delete on public.property_documents for each row execute function public.prevent_evidence_mutation();
drop trigger if exists policy_extractions_immutable on public.policy_extractions;
create trigger policy_extractions_immutable before update or delete on public.policy_extractions for each row execute function public.prevent_evidence_mutation();
