-- Run after Checkpoints 3 and 4 in an isolated Supabase preview database.
begin;
select plan(9);
select has_table('public', 'property_authorizations');
select has_table('public', 'property_timeline_events');
select col_is_pk('public', 'property_authorizations', 'id');
select col_is_pk('public', 'property_timeline_events', 'id');
select policies_are('public', 'property_authorizations', array['property_authorizations_authorized_select']);
select policies_are('public', 'property_timeline_events', array['property_timeline_authorized_select','property_timeline_field_insert']);
select has_trigger('public', 'photos', 'photos_immutable');
select has_trigger('public', 'properties', 'properties_status_transition_guard');
select has_function('public', 'record_homeowner_authorization', array['text','text','text','inet','text']);
select * from finish();
rollback;
