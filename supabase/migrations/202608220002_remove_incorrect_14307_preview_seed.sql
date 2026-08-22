-- Preview-only cleanup. The exact sentinel UUID/address was created on the isolated flagship branch.
-- The guard makes this a no-op anywhere the incorrect preview seed does not exist.
do $$
declare bad_id constant uuid := '14307000-0000-4000-8000-000000000001';
begin
  if exists (
    select 1 from public.properties p join public.organizations o on o.id = p.organization_id
    where p.id = bad_id
      and p.address = '14307 Rippling Creek Lane, Cypress, TX 77429'
      and o.name = 'ASC Edge Flagship Preview'
      and p.canonical_place_id is null
  ) then
    -- These records were generated solely for the incorrect preview seed. Evidence triggers
    -- are restored in the same transaction immediately after the targeted cleanup.
    drop trigger if exists authorizations_immutable on public.property_authorizations;
    drop trigger if exists timeline_immutable on public.property_timeline_events;
    delete from public.property_authorizations where property_id = bad_id;
    delete from public.property_timeline_events where property_id = bad_id;
    create trigger authorizations_immutable before update or delete on public.property_authorizations
      for each row execute function public.prevent_evidence_mutation();
    create trigger timeline_immutable before update or delete on public.property_timeline_events
      for each row execute function public.prevent_evidence_mutation();
    delete from public.share_tokens where property_id = bad_id;
    delete from public.report_events where property_id = bad_id;
    delete from public.properties where id = bad_id;
  end if;
end $$;
