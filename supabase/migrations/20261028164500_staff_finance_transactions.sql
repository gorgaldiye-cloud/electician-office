
create or replace function app_private.get_or_create_staff_customer(
  p_customer_name text,
  p_customer_phone text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_digits text;
  v_phone text;
  v_customer_id uuid;
begin
  if not app_private.has_any_role(array['owner'::public.app_role, 'booking_manager'::public.app_role]) then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if p_customer_name is null or length(trim(p_customer_name)) < 2 or length(trim(p_customer_name)) > 150 then
    raise exception 'INVALID_CUSTOMER_NAME';
  end if;

  v_digits := app_private.normalize_booking_phone(p_customer_phone);
  if length(v_digits) < 10 or length(v_digits) > 15 then
    raise exception 'INVALID_PHONE';
  end if;
  v_phone := '+' || v_digits;

  perform pg_advisory_xact_lock(hashtext('abc_customer_' || v_digits));

  select c.id into v_customer_id
  from public.customers c
  where app_private.normalize_booking_phone(c.phone_e164) = v_digits
  order by c.created_at asc
  limit 1
  for update;

  if v_customer_id is not null then
    update public.customers
    set full_name = trim(p_customer_name), updated_at = now()
    where id = v_customer_id;
    return v_customer_id;
  end if;

  insert into public.customers(full_name, phone_e164, preferred_language, created_via)
  values (trim(p_customer_name), v_phone, 'en', 'staff')
  returning id into v_customer_id;
  return v_customer_id;
end;
$function$;
revoke all on function app_private.get_or_create_staff_customer(text, text) from public, anon, authenticated;

create or replace function app_private.create_staff_quote(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_status text,
  p_valid_until date,
  p_notes text,
  p_items jsonb,
  p_booking_id uuid,
  p_booking_reference text,
  p_discount numeric,
  p_tax_rate numeric
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_customer_id uuid;
  v_quote_id uuid := gen_random_uuid();
  v_quote_number text;
  v_item jsonb;
  v_item_type public.line_item_type;
  v_quantity numeric;
  v_unit_price numeric;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_discount numeric := coalesce(p_discount, 0);
  v_tax_rate numeric := coalesce(p_tax_rate, 0);
  v_tax_amount numeric;
  v_total numeric;
  v_index integer;
  v_year text := to_char(current_date, 'YYYY');
begin
  if not app_private.has_any_role(array['owner'::public.app_role, 'booking_manager'::public.app_role]) then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if coalesce(p_status, '') not in ('draft', 'sent') then raise exception 'INVALID_QUOTE_STATUS'; end if;
  if p_valid_until is null or p_valid_until < current_date then raise exception 'INVALID_VALIDITY_DATE'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'INVALID_LINE_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce(nullif(v_item->>'quantity', '')::numeric, 0);
    v_unit_price := coalesce(nullif(v_item->>'unitPrice', '')::numeric, nullif(v_item->>'unit_price', '')::numeric, 0);
    if v_quantity <= 0 or v_quantity > 100000 or v_unit_price < 0 or v_unit_price > 100000000
      or length(trim(coalesce(v_item->>'description', ''))) < 1
      or length(trim(coalesce(v_item->>'description', ''))) > 500 then
      raise exception 'INVALID_LINE_ITEM';
    end if;
    v_item_type := coalesce(v_item->>'itemType', v_item->>'item_type', 'labor')::public.line_item_type;
    v_subtotal := v_subtotal + round(v_quantity * v_unit_price, 2);
  end loop;

  if v_discount < 0 or v_discount > v_subtotal or v_tax_rate < 0 or v_tax_rate > 100 then
    raise exception 'INVALID_DISCOUNT_OR_TAX';
  end if;
  v_tax_amount := round((v_subtotal - v_discount) * v_tax_rate / 100, 2);
  v_total := v_subtotal - v_discount + v_tax_amount;
  v_customer_id := app_private.get_or_create_staff_customer(p_customer_name, p_customer_phone);

  perform pg_advisory_xact_lock(hashtext('abc_quote_number_' || v_year));
  select 'QUO-' || v_year || '-' || lpad((coalesce(max(nullif(regexp_replace(quote_number, '^QUO-' || v_year || '-', ''), '')::integer), 0) + 1)::text, 4, '0')
  into v_quote_number
  from public.quotes
  where quote_number like 'QUO-' || v_year || '-%';

  insert into public.quotes(
    id, quote_number, booking_id, booking_reference, customer_id, customer_name,
    customer_phone, customer_address, status, subtotal, discount, tax_rate, tax_amount,
    total, valid_until, notes, created_by_staff_id
  ) values (
    v_quote_id, v_quote_number, p_booking_id, nullif(trim(coalesce(p_booking_reference,'')), ''),
    v_customer_id, trim(p_customer_name), '+' || app_private.normalize_booking_phone(p_customer_phone),
    trim(coalesce(p_customer_address,'')), p_status::public.quote_status,
    v_subtotal, v_discount, v_tax_rate, v_tax_amount, v_total, p_valid_until,
    nullif(trim(coalesce(p_notes,'')), ''), app_private.current_staff_id()
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce(nullif(v_item->>'quantity', '')::numeric, 0);
    v_unit_price := coalesce(nullif(v_item->>'unitPrice', '')::numeric, nullif(v_item->>'unit_price', '')::numeric, 0);
    v_item_type := coalesce(v_item->>'itemType', v_item->>'item_type', 'labor')::public.line_item_type;
    v_line_total := round(v_quantity * v_unit_price, 2);
    insert into public.quote_items(quote_id, item_type, description, quantity, unit_price, line_total)
    values (v_quote_id, v_item_type, trim(v_item->>'description'), v_quantity, v_unit_price, v_line_total);
  end loop;

  return jsonb_build_object('id', v_quote_id, 'quoteNumber', v_quote_number, 'customerId', v_customer_id,
    'subtotal', v_subtotal, 'discount', v_discount, 'taxRate', v_tax_rate, 'taxAmount', v_tax_amount, 'total', v_total);
end;
$function$;
revoke all on function app_private.create_staff_quote(text, text, text, text, date, text, jsonb, uuid, text, numeric, numeric) from public, anon, authenticated;
grant execute on function app_private.create_staff_quote(text, text, text, text, date, text, jsonb, uuid, text, numeric, numeric) to authenticated;

create or replace function public.create_staff_quote(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_status text,
  p_valid_until date,
  p_notes text,
  p_items jsonb,
  p_booking_id uuid,
  p_booking_reference text,
  p_discount numeric,
  p_tax_rate numeric
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select app_private.create_staff_quote(
    p_customer_name, p_customer_phone, p_customer_address, p_status,
    p_valid_until, p_notes, p_items, p_booking_id, p_booking_reference, p_discount, p_tax_rate
  );
$function$;
revoke all on function public.create_staff_quote(text, text, text, text, date, text, jsonb, uuid, text, numeric, numeric) from public, anon;
grant execute on function public.create_staff_quote(text, text, text, text, date, text, jsonb, uuid, text, numeric, numeric) to authenticated;

create or replace function app_private.create_staff_invoice(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_status text,
  p_issue_date date,
  p_due_date date,
  p_notes text,
  p_items jsonb,
  p_booking_id uuid,
  p_booking_reference text,
  p_discount numeric,
  p_tax_rate numeric
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_customer_id uuid;
  v_invoice_id uuid := gen_random_uuid();
  v_invoice_number text;
  v_item jsonb;
  v_item_type public.line_item_type;
  v_quantity numeric;
  v_unit_price numeric;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_discount numeric := coalesce(p_discount, 0);
  v_tax_rate numeric := coalesce(p_tax_rate, 0);
  v_tax_amount numeric;
  v_total numeric;
  v_year text := to_char(current_date, 'YYYY');
begin
  if not app_private.has_any_role(array['owner'::public.app_role, 'booking_manager'::public.app_role]) then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if coalesce(p_status, '') not in ('draft', 'issued') then raise exception 'INVALID_INVOICE_STATUS'; end if;
  if p_issue_date is null or p_due_date is null or p_due_date < p_issue_date then raise exception 'INVALID_INVOICE_DATES'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'INVALID_LINE_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce(nullif(v_item->>'quantity', '')::numeric, 0);
    v_unit_price := coalesce(nullif(v_item->>'unitPrice', '')::numeric, nullif(v_item->>'unit_price', '')::numeric, 0);
    if v_quantity <= 0 or v_quantity > 100000 or v_unit_price < 0 or v_unit_price > 100000000
      or length(trim(coalesce(v_item->>'description', ''))) < 1
      or length(trim(coalesce(v_item->>'description', ''))) > 500 then
      raise exception 'INVALID_LINE_ITEM';
    end if;
    v_item_type := coalesce(v_item->>'itemType', v_item->>'item_type', 'labor')::public.line_item_type;
    v_subtotal := v_subtotal + round(v_quantity * v_unit_price, 2);
  end loop;

  if v_discount < 0 or v_discount > v_subtotal or v_tax_rate < 0 or v_tax_rate > 100 then
    raise exception 'INVALID_DISCOUNT_OR_TAX';
  end if;
  v_tax_amount := round((v_subtotal - v_discount) * v_tax_rate / 100, 2);
  v_total := v_subtotal - v_discount + v_tax_amount;
  v_customer_id := app_private.get_or_create_staff_customer(p_customer_name, p_customer_phone);

  perform pg_advisory_xact_lock(hashtext('abc_invoice_number_' || v_year));
  select 'INV-' || v_year || '-' || lpad((coalesce(max(nullif(regexp_replace(invoice_number, '^INV-' || v_year || '-', ''), '')::integer), 0) + 1)::text, 4, '0')
  into v_invoice_number
  from public.invoices
  where invoice_number like 'INV-' || v_year || '-%';

  insert into public.invoices(
    id, invoice_number, booking_id, booking_reference, customer_id, customer_name,
    customer_phone, customer_address, status, subtotal, discount, tax_rate, tax_amount,
    total, amount_paid, issue_date, due_date, notes, created_by_staff_id
  ) values (
    v_invoice_id, v_invoice_number, p_booking_id, nullif(trim(coalesce(p_booking_reference,'')), ''),
    v_customer_id, trim(p_customer_name), '+' || app_private.normalize_booking_phone(p_customer_phone),
    trim(coalesce(p_customer_address,'')), p_status::public.invoice_status, v_subtotal, v_discount,
    v_tax_rate, v_tax_amount, v_total, 0, p_issue_date, p_due_date,
    nullif(trim(coalesce(p_notes,'')), ''), app_private.current_staff_id()
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce(nullif(v_item->>'quantity', '')::numeric, 0);
    v_unit_price := coalesce(nullif(v_item->>'unitPrice', '')::numeric, nullif(v_item->>'unit_price', '')::numeric, 0);
    v_item_type := coalesce(v_item->>'itemType', v_item->>'item_type', 'labor')::public.line_item_type;
    v_line_total := round(v_quantity * v_unit_price, 2);
    insert into public.invoice_items(invoice_id, item_type, description, quantity, unit_price, line_total)
    values (v_invoice_id, v_item_type, trim(v_item->>'description'), v_quantity, v_unit_price, v_line_total);
  end loop;

  return jsonb_build_object('id', v_invoice_id, 'invoiceNumber', v_invoice_number, 'customerId', v_customer_id,
    'subtotal', v_subtotal, 'discount', v_discount, 'taxRate', v_tax_rate, 'taxAmount', v_tax_amount, 'total', v_total);
end;
$function$;
revoke all on function app_private.create_staff_invoice(text, text, text, text, date, date, text, jsonb, uuid, text, numeric, numeric) from public, anon, authenticated;
grant execute on function app_private.create_staff_invoice(text, text, text, text, date, date, text, jsonb, uuid, text, numeric, numeric) to authenticated;

create or replace function public.create_staff_invoice(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_status text,
  p_issue_date date,
  p_due_date date,
  p_notes text,
  p_items jsonb,
  p_booking_id uuid,
  p_booking_reference text,
  p_discount numeric,
  p_tax_rate numeric
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select app_private.create_staff_invoice(
    p_customer_name, p_customer_phone, p_customer_address, p_status,
    p_issue_date, p_due_date, p_notes, p_items, p_booking_id, p_booking_reference, p_discount, p_tax_rate
  );
$function$;
revoke all on function public.create_staff_invoice(text, text, text, text, date, date, text, jsonb, uuid, text, numeric, numeric) from public, anon;
grant execute on function public.create_staff_invoice(text, text, text, text, date, date, text, jsonb, uuid, text, numeric, numeric) to authenticated;

create or replace function app_private.convert_staff_quote_to_invoice(p_quote_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_quote public.quotes%rowtype;
  v_invoice_id uuid := gen_random_uuid();
  v_invoice_number text;
  v_year text := to_char(current_date, 'YYYY');
begin
  if not app_private.has_any_role(array['owner'::public.app_role, 'booking_manager'::public.app_role]) then
    raise exception 'NOT_AUTHORIZED';
  end if;
  select q.* into v_quote from public.quotes q where q.id=p_quote_id for update;
  if not found then raise exception 'QUOTE_NOT_FOUND'; end if;
  if v_quote.status not in ('draft'::public.quote_status, 'sent'::public.quote_status) then
    raise exception 'QUOTE_NOT_CONVERTIBLE';
  end if;

  perform pg_advisory_xact_lock(hashtext('abc_invoice_number_' || v_year));
  select 'INV-' || v_year || '-' || lpad((coalesce(max(nullif(regexp_replace(invoice_number, '^INV-' || v_year || '-', ''), '')::integer), 0) + 1)::text, 4, '0')
    into v_invoice_number from public.invoices where invoice_number like 'INV-' || v_year || '-%';

  insert into public.invoices(
    id, invoice_number, booking_id, booking_reference, customer_id, customer_name,
    customer_phone, customer_address, status, subtotal, discount, tax_rate, tax_amount,
    total, amount_paid, issue_date, due_date, notes, created_by_staff_id
  ) values (
    v_invoice_id, v_invoice_number, v_quote.booking_id, v_quote.booking_reference, v_quote.customer_id,
    v_quote.customer_name, v_quote.customer_phone, v_quote.customer_address, 'issued',
    v_quote.subtotal, v_quote.discount, v_quote.tax_rate, v_quote.tax_amount, v_quote.total,
    0, current_date, current_date + 7, v_quote.notes, app_private.current_staff_id()
  );

  insert into public.invoice_items(invoice_id, item_type, description, quantity, unit_price, line_total)
    select v_invoice_id, item_type, description, quantity, unit_price, line_total
    from public.quote_items where quote_id = v_quote.id;
  update public.quotes set status='approved', updated_at=now() where id=v_quote.id;

  return jsonb_build_object('id', v_invoice_id, 'invoiceNumber', v_invoice_number, 'quoteId', v_quote.id);
end;
$function$;
revoke all on function app_private.convert_staff_quote_to_invoice(uuid) from public, anon, authenticated;
grant execute on function app_private.convert_staff_quote_to_invoice(uuid) to authenticated;

create or replace function public.convert_staff_quote_to_invoice(p_quote_id uuid)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select app_private.convert_staff_quote_to_invoice(p_quote_id);
$function$;
revoke all on function public.convert_staff_quote_to_invoice(uuid) from public, anon;
grant execute on function public.convert_staff_quote_to_invoice(uuid) to authenticated;

create or replace function app_private.record_staff_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_method text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_invoice public.invoices%rowtype;
  v_payment_id uuid := gen_random_uuid();
  v_paid_by text;
  v_new_paid numeric;
  v_new_status public.invoice_status;
begin
  if not app_private.has_any_role(array['owner'::public.app_role]) then raise exception 'NOT_AUTHORIZED'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 100000000 then raise exception 'INVALID_PAYMENT_AMOUNT'; end if;
  if coalesce(p_method, '') not in ('cash','bank_transfer','other','gateway') then raise exception 'INVALID_PAYMENT_METHOD'; end if;

  select i.* into v_invoice from public.invoices i where i.id=p_invoice_id for update;
  if not found then raise exception 'INVOICE_NOT_FOUND'; end if;
  if v_invoice.status = 'void'::public.invoice_status then raise exception 'INVOICE_VOID'; end if;
  if p_amount > greatest(0, v_invoice.total - v_invoice.amount_paid) then raise exception 'PAYMENT_EXCEEDS_BALANCE'; end if;

  select sp.full_name into v_paid_by from public.staff_profiles sp where sp.id=app_private.current_staff_id();
  v_new_paid := v_invoice.amount_paid + p_amount;
  v_new_status := case when v_new_paid >= v_invoice.total then 'paid'::public.invoice_status else 'partially_paid'::public.invoice_status end;

  insert into public.payments(id, invoice_id, amount, method, paid_at, recorded_by_staff_id, recorded_by, notes)
  values (v_payment_id, p_invoice_id, p_amount, p_method::public.payment_method, now(), app_private.current_staff_id(),
    coalesce(v_paid_by,'Owner'), nullif(trim(coalesce(p_notes,'')), ''));

  update public.invoices set amount_paid=v_new_paid, status=v_new_status, updated_at=now() where id=p_invoice_id;

  return jsonb_build_object('id',v_payment_id,'invoiceId',p_invoice_id,'amount',p_amount,'method',p_method,'amountPaid',v_new_paid,'status',v_new_status);
end;
$function$;
revoke all on function app_private.record_staff_payment(uuid, numeric, text, text) from public, anon, authenticated;
grant execute on function app_private.record_staff_payment(uuid, numeric, text, text) to authenticated;

create or replace function public.record_staff_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_method text,
  p_notes text
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select app_private.record_staff_payment(p_invoice_id, p_amount, p_method, p_notes);
$function$;
revoke all on function public.record_staff_payment(uuid, numeric, text, text) from public, anon;
grant execute on function public.record_staff_payment(uuid, numeric, text, text) to authenticated;
