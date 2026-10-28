
drop policy if exists booking_attachments_staff_insert on public.booking_attachments;
drop policy if exists booking_attachments_website_insert on public.booking_attachments;

create policy booking_attachments_insert
on public.booking_attachments for insert to anon, authenticated
with check (
  (
    app_private.has_any_role(array['owner'::public.app_role, 'booking_manager'::public.app_role])
    or exists (
      select 1 from public.bookings b
      where b.id = booking_attachments.booking_id
        and b.assigned_technician_id = (select app_private.current_staff_id())
    )
  )
  or (
    uploaded_by_staff_id is null
    and file_size > 0 and file_size <= 5242880
    and file_type in ('image/jpeg', 'image/png', 'image/webp')
    and storage_path like booking_id::text || '/%'
    and app_private.can_upload_booking_attachment(booking_id)
  )
);
