
-- Keep the REST-exposed RPC entry points as SECURITY INVOKER wrappers.
-- Privileged implementations live in the non-exposed app_private schema and still
-- validate ownership, status, input bounds, scheduling windows, and overlaps.
grant usage on schema app_private to anon, authenticated;

alter function public.get_website_available_slots(text, date) set schema app_private;
alter function public.create_website_booking(text, text, text, text, text, text, text, text, text, timestamptz, timestamptz, text, text, timestamptz, timestamptz) set schema app_private;
alter function public.track_website_booking(text, text) set schema app_private;
alter function public.cancel_website_booking(text, text, text) set schema app_private;
alter function public.reschedule_website_booking(text, text, timestamptz, timestamptz) set schema app_private;

grant execute on function app_private.get_website_available_slots(text, date) to anon, authenticated;
grant execute on function app_private.create_website_booking(text, text, text, text, text, text, text, text, text, timestamptz, timestamptz, text, text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function app_private.track_website_booking(text, text) to anon, authenticated;
grant execute on function app_private.cancel_website_booking(text, text, text) to anon, authenticated;
grant execute on function app_private.reschedule_website_booking(text, text, timestamptz, timestamptz) to anon, authenticated;

create or replace function public.get_website_available_slots(p_service_id text, p_date date)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select app_private.get_website_available_slots(p_service_id, p_date);
$function$;
revoke all on function public.get_website_available_slots(text, date) from public;
grant execute on function public.get_website_available_slots(text, date) to anon, authenticated;

create or replace function public.create_website_booking(
  p_service_id text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_problem_description text,
  p_address_line text,
  p_city text,
  p_area_name text,
  p_postal_code text,
  p_scheduled_start timestamptz,
  p_scheduled_end timestamptz,
  p_urgency text,
  p_language text,
  p_privacy_accepted_at timestamptz,
  p_terms_accepted_at timestamptz
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select app_private.create_website_booking(
    p_service_id, p_customer_name, p_customer_phone, p_customer_email,
    p_problem_description, p_address_line, p_city, p_area_name, p_postal_code,
    p_scheduled_start, p_scheduled_end, p_urgency, p_language,
    p_privacy_accepted_at, p_terms_accepted_at
  );
$function$;
revoke all on function public.create_website_booking(text, text, text, text, text, text, text, text, text, timestamptz, timestamptz, text, text, timestamptz, timestamptz) from public;
grant execute on function public.create_website_booking(text, text, text, text, text, text, text, text, text, timestamptz, timestamptz, text, text, timestamptz, timestamptz) to anon, authenticated;

create or replace function public.track_website_booking(p_booking_reference text, p_customer_phone text)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select app_private.track_website_booking(p_booking_reference, p_customer_phone);
$function$;
revoke all on function public.track_website_booking(text, text) from public;
grant execute on function public.track_website_booking(text, text) to anon, authenticated;

create or replace function public.cancel_website_booking(
  p_booking_reference text,
  p_customer_phone text,
  p_reason text default 'Customer requested cancellation'
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select app_private.cancel_website_booking(p_booking_reference, p_customer_phone, p_reason);
$function$;
revoke all on function public.cancel_website_booking(text, text, text) from public;
grant execute on function public.cancel_website_booking(text, text, text) to anon, authenticated;

create or replace function public.reschedule_website_booking(
  p_booking_reference text,
  p_customer_phone text,
  p_new_start timestamptz,
  p_new_end timestamptz
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select app_private.reschedule_website_booking(
    p_booking_reference, p_customer_phone, p_new_start, p_new_end
  );
$function$;
revoke all on function public.reschedule_website_booking(text, text, timestamptz, timestamptz) from public;
grant execute on function public.reschedule_website_booking(text, text, timestamptz, timestamptz) to anon, authenticated;
