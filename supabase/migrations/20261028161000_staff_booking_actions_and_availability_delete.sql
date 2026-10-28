
create or replace function app_private.update_staff_booking_status(
  p_booking_id uuid,
  p_new_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_booking public.bookings%rowtype;
  v_status public.booking_status;
  v_role public.app_role;
  v_name text;
  v_note text;
begin
  if p_new_status not in ('pending','confirmed','in_progress','completed','cancelled','rejected','no_show') then
    raise exception 'INVALID_BOOKING_STATUS';
  end if;
  v_status := p_new_status::public.booking_status;

  v_role := app_private.current_staff_role();
  if v_role not in ('owner'::public.app_role, 'booking_manager'::public.app_role, 'technician'::public.app_role) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select b.* into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;

  if v_role = 'technician'::public.app_role then
    if v_booking.assigned_technician_id is distinct from app_private.current_staff_id() then
      raise exception 'NOT_AUTHORIZED';
    end if;
    if v_booking.status not in ('confirmed'::public.booking_status, 'in_progress'::public.booking_status) then
      raise exception 'INVALID_STATUS_TRANSITION';
    end if;
    if v_status not in ('in_progress'::public.booking_status, 'completed'::public.booking_status, 'no_show'::public.booking_status) then
      raise exception 'NOT_AUTHORIZED';
    end if;
  end if;

  select sp.full_name into v_name
  from public.staff_profiles sp
  where sp.id = app_private.current_staff_id();
  v_note := left(coalesce(nullif(trim(p_note), ''), 'Status changed to ' || p_new_status), 1000);

  update public.bookings
  set status = v_status,
      updated_at = now()
  where id = v_booking.id;

  insert into public.booking_status_history (
    id, booking_id, old_status, new_status, changed_by_staff_id,
    changed_by, changed_by_type, note
  ) values (
    gen_random_uuid(), v_booking.id, v_booking.status, v_status,
    app_private.current_staff_id(), coalesce(v_name, 'Staff'), 'staff', v_note
  );

  return app_private.website_booking_payload(v_booking.id);
end;
$function$;
revoke all on function app_private.update_staff_booking_status(uuid, text, text) from public;
grant execute on function app_private.update_staff_booking_status(uuid, text, text) to authenticated;

create or replace function public.update_staff_booking_status(
  p_booking_id uuid,
  p_new_status text,
  p_note text default null
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select app_private.update_staff_booking_status(p_booking_id, p_new_status, p_note);
$function$;
revoke all on function public.update_staff_booking_status(uuid, text, text) from public, anon;
grant execute on function public.update_staff_booking_status(uuid, text, text) to authenticated;

drop policy if exists availability_blocks_owner_delete on public.availability_blocks;
create policy availability_blocks_owner_delete
on public.availability_blocks for delete to authenticated
using (app_private.has_any_role(array['owner'::public.app_role]));
