
-- Atomic, validated public booking actions. Customer and booking rows are not exposed
-- to anonymous SELECT; callers must prove ownership using both the reference and phone.
create or replace function app_private.normalize_booking_phone(p_phone text)
returns text
language sql
immutable
set search_path = pg_catalog
as $function$
  select case
    when left(v.digits, 4) = '0092' then substr(v.digits, 3)
    when left(v.digits, 2) = '92' then v.digits
    when left(v.digits, 1) = '0' then '92' || substr(v.digits, 2)
    when length(v.digits) = 10 and left(v.digits, 1) = '3' then '92' || v.digits
    else v.digits
  end
  from (select regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') as digits) v;
$function$;
revoke all on function app_private.normalize_booking_phone(text) from public, anon, authenticated;

create or replace function app_private.website_booking_payload(p_booking_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
  select jsonb_build_object(
    'id', b.id,
    'bookingReference', b.booking_reference,
    'customerId', b.customer_id,
    'serviceId', b.service_id,
    'serviceNameEn', b.service_name_en,
    'serviceNameUr', b.service_name_ur,
    'assignedTechnicianName', b.assigned_technician_name,
    'customerName', b.customer_name,
    'customerPhone', b.customer_phone,
    'customerEmail', b.customer_email,
    'problemDescription', b.problem_description,
    'addressLine', b.address_line,
    'city', b.city,
    'areaName', b.area_name,
    'postalCode', b.postal_code,
    'scheduledStart', b.scheduled_start,
    'scheduledEnd', b.scheduled_end,
    'status', b.status,
    'urgency', b.urgency,
    'estimatedAmount', b.estimated_amount,
    'finalAmount', b.final_amount,
    'customerNotes', b.customer_notes,
    'cancellationReason', b.cancellation_reason,
    'rejectionReason', b.rejection_reason,
    'language', b.language,
    'source', b.source,
    'privacyAcceptedAt', b.privacy_accepted_at,
    'termsAcceptedAt', b.terms_accepted_at,
    'createdAt', b.created_at,
    'updatedAt', b.updated_at,
    'history', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', h.id,
        'bookingId', h.booking_id,
        'oldStatus', h.old_status,
        'newStatus', h.new_status,
        'changedBy', h.changed_by,
        'changedByType', h.changed_by_type,
        'note', h.note,
        'createdAt', h.created_at
      ) order by h.created_at desc)
      from public.booking_status_history h
      where h.booking_id = b.id
    ), '[]'::jsonb),
    'attachments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'bookingId', a.booking_id,
        'fileName', a.file_name,
        'fileUrl', a.storage_path,
        'fileSize', a.file_size,
        'fileType', a.file_type
      ) order by a.created_at asc)
      from public.booking_attachments a
      where a.booking_id = b.id
    ), '[]'::jsonb)
  )
  from public.bookings b
  where b.id = p_booking_id;
$function$;
revoke all on function app_private.website_booking_payload(uuid) from public, anon, authenticated;

create or replace function public.get_website_available_slots(p_service_id text, p_date date)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_duration integer;
  v_min_notice integer := 2;
  v_max_advance integer := 30;
  v_today date := (now() at time zone 'Asia/Karachi')::date;
  v_start_minute integer;
  v_start timestamptz;
  v_end timestamptz;
  v_local_start timestamp;
  v_local_end timestamp;
  v_available boolean;
  v_slots jsonb := '[]'::jsonb;
begin
  select greatest(30, coalesce(s.estimated_duration_minutes, 60) + coalesce(s.buffer_minutes, 0))
    into v_duration
  from public.services s
  where s.id = p_service_id and s.is_active and s.is_bookable;

  if not found or p_date is null then
    return v_slots;
  end if;

  select coalesce(bs.min_notice_hours, 2), coalesce(bs.max_advance_days, 30)
    into v_min_notice, v_max_advance
  from public.business_settings bs
  where bs.id = true;

  v_min_notice := coalesce(v_min_notice, 2);
  v_max_advance := coalesce(v_max_advance, 30);

  -- Preserve the site's familiar start times; duration follows the selected service.
  foreach v_start_minute in array array[540, 630, 720, 840, 930, 1020]
  loop
    v_start := (p_date::timestamp + make_interval(mins => v_start_minute)) at time zone 'Asia/Karachi';
    v_end := v_start + make_interval(mins => v_duration);
    v_local_start := v_start at time zone 'Asia/Karachi';
    v_local_end := v_end at time zone 'Asia/Karachi';

    v_available :=
      p_date >= v_today
      and p_date <= v_today + v_max_advance
      and extract(isodow from v_local_start) <> 7
      and v_start >= now() + make_interval(hours => v_min_notice)
      and v_local_start::time >= time '09:00'
      and v_local_end::date = v_local_start::date
      and v_local_end::time <= time '19:00'
      and not exists (
        select 1
        from public.bookings b
        where b.status in ('pending', 'confirmed', 'in_progress')
          and b.scheduled_start < v_end
          and b.scheduled_end > v_start
      );

    v_slots := v_slots || jsonb_build_array(jsonb_build_object(
      'time', to_char(v_local_start, 'HH12:MI AM') || ' - ' || to_char(v_local_end, 'HH12:MI AM'),
      'start', v_start,
      'end', v_end,
      'available', coalesce(v_available, false)
    ));
  end loop;
  return v_slots;
end;
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
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_service public.services%rowtype;
  v_area public.service_areas%rowtype;
  v_settings public.business_settings%rowtype;
  v_customer_id uuid := gen_random_uuid();
  v_booking_id uuid := gen_random_uuid();
  v_reference text;
  v_phone_digits text;
  v_phone text;
  v_local_start timestamp;
  v_local_end timestamp;
  v_required_minutes integer;
begin
  if p_customer_name is null or length(trim(p_customer_name)) < 2 or length(trim(p_customer_name)) > 150 then
    raise exception 'INVALID_CUSTOMER_NAME';
  end if;
  if p_problem_description is null or length(trim(p_problem_description)) < 10 or length(trim(p_problem_description)) > 4000 then
    raise exception 'INVALID_PROBLEM_DESCRIPTION';
  end if;
  if p_address_line is null or length(trim(p_address_line)) < 5 or length(trim(p_address_line)) > 500 then
    raise exception 'INVALID_ADDRESS';
  end if;
  if p_customer_email is not null and length(trim(p_customer_email)) > 254 then
    raise exception 'INVALID_EMAIL';
  end if;
  if p_urgency not in ('standard', 'urgent', 'emergency') then
    raise exception 'INVALID_URGENCY';
  end if;
  if p_language not in ('en', 'ur') then
    raise exception 'INVALID_LANGUAGE';
  end if;
  if p_privacy_accepted_at is null or p_terms_accepted_at is null
     or p_privacy_accepted_at > now() + interval '5 minutes'
     or p_terms_accepted_at > now() + interval '5 minutes' then
    raise exception 'CONSENT_REQUIRED';
  end if;

  v_phone_digits := app_private.normalize_booking_phone(p_customer_phone);
  if length(v_phone_digits) < 10 or length(v_phone_digits) > 15 then
    raise exception 'INVALID_PHONE';
  end if;
  v_phone := '+' || v_phone_digits;

  select s.* into v_service
  from public.services s
  where s.id = p_service_id and s.is_active and s.is_bookable;
  if not found then
    raise exception 'SERVICE_UNAVAILABLE';
  end if;

  select bs.* into v_settings from public.business_settings bs where bs.id = true;
  if not found then
    raise exception 'BOOKING_SETTINGS_UNAVAILABLE';
  end if;

  select a.* into v_area
  from public.service_areas a
  where a.is_active
    and lower(a.city) = lower(trim(coalesce(p_city, '')))
    and lower(a.area) = lower(trim(coalesce(p_area_name, '')))
  limit 1;
  if not found then
    raise exception 'SERVICE_AREA_UNAVAILABLE';
  end if;

  if p_scheduled_start is null or p_scheduled_end is null or p_scheduled_end <= p_scheduled_start then
    raise exception 'INVALID_TIME_RANGE';
  end if;

  v_local_start := p_scheduled_start at time zone 'Asia/Karachi';
  v_local_end := p_scheduled_end at time zone 'Asia/Karachi';
  v_required_minutes := greatest(30, coalesce(v_service.estimated_duration_minutes, 60) + coalesce(v_service.buffer_minutes, 0));

  if extract(epoch from (p_scheduled_end - p_scheduled_start)) / 60 < v_required_minutes then
    raise exception 'SERVICE_DURATION_MISMATCH';
  end if;
  if v_local_start::date <> v_local_end::date
     or extract(isodow from v_local_start) = 7
     or v_local_start::time < time '09:00'
     or v_local_end::time > time '19:00' then
    raise exception 'OUTSIDE_BUSINESS_HOURS';
  end if;
  if p_scheduled_start < now() + make_interval(hours => coalesce(v_settings.min_notice_hours, 2)) then
    raise exception 'MINIMUM_NOTICE_REQUIRED';
  end if;
  if p_scheduled_start > now() + make_interval(days => coalesce(v_settings.max_advance_days, 30)) then
    raise exception 'MAXIMUM_ADVANCE_EXCEEDED';
  end if;

  -- Serialize public slot allocation, then check conflicts again at write time.
  perform pg_advisory_xact_lock(hashtext('abc_electrician_website_slots'));
  if exists (
    select 1 from public.bookings b
    where b.status in ('pending', 'confirmed', 'in_progress')
      and b.scheduled_start < p_scheduled_end
      and b.scheduled_end > p_scheduled_start
  ) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  insert into public.customers (
    id, full_name, phone_e164, email, preferred_language, created_via
  ) values (
    v_customer_id, trim(p_customer_name), v_phone, nullif(trim(coalesce(p_customer_email, '')), ''),
    p_language, 'website'
  );

  v_reference := 'ABC-' || to_char(now() at time zone 'Asia/Karachi', 'YYMMDD') || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.bookings (
    id, booking_reference, customer_id, service_id, service_name_en, service_name_ur,
    customer_name, customer_phone, customer_email, problem_description, address_line,
    city, area_name, postal_code, scheduled_start, scheduled_end, status, urgency,
    estimated_amount, language, source, privacy_accepted_at, terms_accepted_at
  ) values (
    v_booking_id, v_reference, v_customer_id, v_service.id, v_service.name_en, v_service.name_ur,
    trim(p_customer_name), v_phone, nullif(trim(coalesce(p_customer_email, '')), ''),
    trim(p_problem_description), trim(p_address_line), v_area.city, v_area.area,
    coalesce(v_area.postal_code, nullif(trim(coalesce(p_postal_code, '')), '')),
    p_scheduled_start, p_scheduled_end, 'pending', p_urgency::public.urgency_level,
    null, p_language, 'website', p_privacy_accepted_at, p_terms_accepted_at
  );

  insert into public.booking_status_history (
    id, booking_id, old_status, new_status, changed_by_staff_id, changed_by, changed_by_type, note
  ) values (
    gen_random_uuid(), v_booking_id, null, 'pending', null, trim(p_customer_name),
    'customer', 'Website booking request submitted'
  );

  return app_private.website_booking_payload(v_booking_id);
end;
$function$;
revoke all on function public.create_website_booking(text, text, text, text, text, text, text, text, text, timestamptz, timestamptz, text, text, timestamptz, timestamptz) from public;
grant execute on function public.create_website_booking(text, text, text, text, text, text, text, text, text, timestamptz, timestamptz, text, text, timestamptz, timestamptz) to anon, authenticated;

create or replace function public.track_website_booking(p_booking_reference text, p_customer_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_booking_id uuid;
  v_phone text;
begin
  v_phone := app_private.normalize_booking_phone(p_customer_phone);
  if p_booking_reference is null or length(trim(p_booking_reference)) < 8
     or length(v_phone) < 10 or length(v_phone) > 15 then
    return null;
  end if;

  select b.id into v_booking_id
  from public.bookings b
  where upper(b.booking_reference) = upper(trim(p_booking_reference))
    and app_private.normalize_booking_phone(b.customer_phone) = v_phone
    and b.source = 'website'
  limit 1;

  if v_booking_id is null then return null; end if;
  return app_private.website_booking_payload(v_booking_id);
end;
$function$;
revoke all on function public.track_website_booking(text, text) from public;
grant execute on function public.track_website_booking(text, text) to anon, authenticated;

create or replace function public.cancel_website_booking(
  p_booking_reference text,
  p_customer_phone text,
  p_reason text default 'Customer requested cancellation'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_booking public.bookings%rowtype;
  v_phone text;
  v_cancel_window integer := 4;
  v_reason text;
begin
  v_phone := app_private.normalize_booking_phone(p_customer_phone);
  if length(v_phone) < 10 or length(v_phone) > 15 then
    return jsonb_build_object('ok', false, 'message', 'Booking not found. Check the reference and phone number.');
  end if;

  select b.* into v_booking
  from public.bookings b
  where upper(b.booking_reference) = upper(trim(coalesce(p_booking_reference, '')))
    and app_private.normalize_booking_phone(b.customer_phone) = v_phone
    and b.source = 'website'
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Booking not found. Check the reference and phone number.');
  end if;

  select coalesce(bs.cancellation_window_hours, 4) into v_cancel_window
  from public.business_settings bs where bs.id = true;
  v_cancel_window := coalesce(v_cancel_window, 4);

  if v_booking.status not in ('pending', 'confirmed') then
    return jsonb_build_object('ok', false, 'message', 'This booking can no longer be cancelled online. Please contact support.');
  end if;
  if v_booking.scheduled_start <= now() + make_interval(hours => v_cancel_window) then
    return jsonb_build_object('ok', false, 'message', 'The online cancellation window has closed. Please contact support.');
  end if;

  v_reason := left(coalesce(nullif(trim(p_reason), ''), 'Customer requested cancellation'), 500);
  update public.bookings set status = 'cancelled', cancellation_reason = v_reason
  where id = v_booking.id;

  insert into public.booking_status_history (
    id, booking_id, old_status, new_status, changed_by_staff_id, changed_by, changed_by_type, note
  ) values (
    gen_random_uuid(), v_booking.id, v_booking.status, 'cancelled', null,
    v_booking.customer_name, 'customer', 'Customer cancelled online: ' || v_reason
  );

  return jsonb_build_object('ok', true, 'booking', app_private.website_booking_payload(v_booking.id));
end;
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
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_booking public.bookings%rowtype;
  v_phone text;
  v_cancel_window integer := 4;
  v_min_notice integer := 2;
  v_max_advance integer := 30;
  v_local_start timestamp;
  v_local_end timestamp;
begin
  v_phone := app_private.normalize_booking_phone(p_customer_phone);
  if length(v_phone) < 10 or length(v_phone) > 15 then
    return jsonb_build_object('ok', false, 'message', 'Booking not found. Check the reference and phone number.');
  end if;
  if p_new_start is null or p_new_end is null or p_new_end <= p_new_start then
    return jsonb_build_object('ok', false, 'message', 'Please select a valid appointment time.');
  end if;

  perform pg_advisory_xact_lock(hashtext('abc_electrician_website_slots'));
  select b.* into v_booking
  from public.bookings b
  where upper(b.booking_reference) = upper(trim(coalesce(p_booking_reference, '')))
    and app_private.normalize_booking_phone(b.customer_phone) = v_phone
    and b.source = 'website'
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Booking not found. Check the reference and phone number.');
  end if;
  if v_booking.status not in ('pending', 'confirmed') then
    return jsonb_build_object('ok', false, 'message', 'This booking cannot be rescheduled online. Please contact support.');
  end if;

  select
    coalesce(bs.cancellation_window_hours, 4),
    coalesce(bs.min_notice_hours, 2),
    coalesce(bs.max_advance_days, 30)
  into v_cancel_window, v_min_notice, v_max_advance
  from public.business_settings bs where bs.id = true;
  v_cancel_window := coalesce(v_cancel_window, 4);
  v_min_notice := coalesce(v_min_notice, 2);
  v_max_advance := coalesce(v_max_advance, 30);

  if v_booking.scheduled_start <= now() + make_interval(hours => v_cancel_window) then
    return jsonb_build_object('ok', false, 'message', 'The online reschedule window has closed. Please contact support.');
  end if;

  v_local_start := p_new_start at time zone 'Asia/Karachi';
  v_local_end := p_new_end at time zone 'Asia/Karachi';
  if v_local_start::date <> v_local_end::date
     or extract(isodow from v_local_start) = 7
     or v_local_start::time < time '09:00'
     or v_local_end::time > time '19:00'
     or p_new_start < now() + make_interval(hours => v_min_notice)
     or p_new_start > now() + make_interval(days => v_max_advance) then
    return jsonb_build_object('ok', false, 'message', 'That appointment time is outside the allowed booking window.');
  end if;

  if exists (
    select 1 from public.bookings other
    where other.id <> v_booking.id
      and other.status in ('pending', 'confirmed', 'in_progress')
      and other.scheduled_start < p_new_end
      and other.scheduled_end > p_new_start
  ) then
    return jsonb_build_object('ok', false, 'message', 'That appointment slot is no longer available. Please choose another slot.');
  end if;

  update public.bookings
  set scheduled_start = p_new_start, scheduled_end = p_new_end, status = 'pending'
  where id = v_booking.id;

  insert into public.booking_status_history (
    id, booking_id, old_status, new_status, changed_by_staff_id, changed_by, changed_by_type, note
  ) values (
    gen_random_uuid(), v_booking.id, v_booking.status, 'pending', null,
    v_booking.customer_name, 'customer', 'Customer rescheduled online'
  );

  return jsonb_build_object('ok', true, 'booking', app_private.website_booking_payload(v_booking.id));
end;
$function$;
revoke all on function public.reschedule_website_booking(text, text, timestamptz, timestamptz) from public;
grant execute on function public.reschedule_website_booking(text, text, timestamptz, timestamptz) to anon, authenticated;

-- Public visitors submit booking requests via the validated RPC, not raw table INSERTs.
drop policy if exists bookings_insert_website_or_staff on public.bookings;
create policy bookings_insert_staff_only
on public.bookings for insert to authenticated
with check (app_private.has_any_role(array['owner'::public.app_role, 'booking_manager'::public.app_role]));
revoke insert on table public.bookings from anon;

drop policy if exists customers_insert_website_or_staff on public.customers;
create policy customers_insert_staff_only
on public.customers for insert to authenticated
with check (app_private.has_any_role(array['owner'::public.app_role, 'booking_manager'::public.app_role]));
revoke insert on table public.customers from anon;

-- Private object storage for booking photos; only staff can read uploaded objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-attachments', 'booking-attachments', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create or replace function app_private.can_upload_booking_attachment(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
  select exists (
    select 1 from public.bookings b
    where b.id = p_booking_id
      and b.source = 'website'
      and b.status = 'pending'
      and b.assigned_technician_id is null
  );
$function$;
revoke all on function app_private.can_upload_booking_attachment(uuid) from public;
grant execute on function app_private.can_upload_booking_attachment(uuid) to anon, authenticated;

drop policy if exists website_booking_attachment_upload on storage.objects;
create policy website_booking_attachment_upload
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'booking-attachments'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and app_private.can_upload_booking_attachment(((storage.foldername(name))[1])::uuid)
  and name !~ '(^|/)\.\.?(/|$)'
);

drop policy if exists booking_attachment_staff_read on storage.objects;
create policy booking_attachment_staff_read
on storage.objects for select to authenticated
using (
  bucket_id = 'booking-attachments'
  and exists (
    select 1
    from public.booking_attachments a
    join public.bookings b on b.id = a.booking_id
    where a.storage_path = storage.objects.name
      and (
        app_private.has_any_role(array['owner'::public.app_role, 'booking_manager'::public.app_role])
        or b.assigned_technician_id = app_private.current_staff_id()
      )
  )
);

grant insert on table public.booking_attachments to anon;

drop policy if exists booking_attachments_website_insert on public.booking_attachments;
create policy booking_attachments_website_insert
on public.booking_attachments for insert to anon, authenticated
with check (
  uploaded_by_staff_id is null
  and file_size > 0 and file_size <= 5242880
  and file_type in ('image/jpeg', 'image/png', 'image/webp')
  and storage_path like booking_id::text || '/%'
  and app_private.can_upload_booking_attachment(booking_id)
);
