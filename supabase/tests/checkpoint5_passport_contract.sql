-- Run after Checkpoints 3–5 in an isolated Supabase preview database.
begin;
select plan(10);
select has_table('public', 'property_characteristics');
select has_table('public', 'maintenance_items');
select has_table('public', 'property_documents');
select has_table('public', 'policy_extractions');
select has_table('public', 'citation_registry');
select row_security_active('public.property_characteristics');
select row_security_active('public.maintenance_items');
select row_security_active('public.property_documents');
select has_trigger('public', 'property_documents', 'property_documents_immutable');
select has_trigger('public', 'policy_extractions', 'policy_extractions_immutable');
select * from finish();
rollback;
