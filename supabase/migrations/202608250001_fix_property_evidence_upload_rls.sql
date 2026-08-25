-- Storage assigns object ownership as part of its insert pipeline, so owner_id is
-- not a reliable WITH CHECK input. Authorize the JWT against both the tenant
-- folder and the exact property folder instead.
drop policy if exists property_evidence_member_insert on storage.objects;
create policy property_evidence_member_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'property-evidence'
  and exists (
    select 1
    from public.properties p
    where p.organization_id::text = (storage.foldername(name))[1]
      and p.id::text = (storage.foldername(name))[2]
      and public.can_access_property(p.id)
      and public.is_org_member(
        p.organization_id,
        array['platform_admin','licensee_owner','manager','office_user','inspector']::public.app_role[]
      )
  )
);
