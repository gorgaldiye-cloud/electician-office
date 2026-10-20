# 05 — BACKEND SCHEMA (PostgreSQL / Supabase)
**Project:** ABC Electrician Services
This is a **specification with reference DDL**. It is applied in **Stage C only** (after frontend + images are complete). Table/column names are the contract with the frontend DTOs (Doc 02 §3). The generated SQL (by AI Studio) will be reviewed against this document before running.

**Conventions:** UUID PKs (`gen_random_uuid()`), `snake_case`, `timestamptz` UTC, `created_at/updated_at` on mutable tables (trigger `set_updated_at`), money as `numeric(12,2)` in PKR, soft-delete via `is_active`/`deleted_at` where history matters, no hard delete of bookings/invoices/payments, all tables `ENABLE ROW LEVEL SECURITY`.

---

## 1. Migration Order (SQL folder)

| File | Content |
|---|---|
| `01_extensions_enums.sql` | extensions (`pgcrypto`, `btree_gist`), enums, `set_updated_at()` |
| `02_identity_roles.sql` | `profiles`, `user_roles`, helper functions (`has_role`, `is_staff`), signup trigger, role-protection triggers |
| `03_catalog.sql` | `service_categories`, `services`, `service_areas`, `service_area_restrictions` |
| `04_scheduling.sql` | `business_hours`, `holidays`, `technician_services`, `staff_schedules`, `availability_blocks` |
| `05_customers_bookings.sql` | `customers`, `customer_notes`, `bookings`, `booking_status_history`, `booking_attachments`, `booking_access_tokens`, `idempotency_keys`, `rate_limits`, indexes, exclusion constraint |
| `06_billing.sql` | `quotes`, `quote_items`, `invoices`, `invoice_items`, `payments`, invoice number sequence |
| `07_content.sql` | `projects`, `project_images`, `blog_categories`, `blog_posts`, `faqs`, `testimonials`, `reviews`, `customer_inquiries`, `legal_pages` |
| `08_settings_notifications_audit.sql` | `business_settings`, `notification_templates`, `notifications`, `appointment_reminders`, `audit_logs`, `data_requests`, `analytics_events`, `analytics_daily` |
| `09_functions_rpc.sql` | `get_available_slots`, `create_booking_tx`, `change_booking_status`, `reschedule_booking`, `assign_technician`, `generate_booking_reference`, `next_invoice_number`, `dashboard_summary`, `purge_expired_data` |
| `10_rls_policies.sql` | all RLS policies |
| `11_storage.sql` | buckets + storage policies |
| `12_seed_placeholders.sql` | business hours defaults, example services (marked placeholder), settings keys, notification templates (no fake business facts) |
| `13_cron.sql` | pg_cron jobs |
Each file idempotent where possible (`if not exists`), with header comment and rollback note.

---

## 2. Enums

```sql
create type app_role as enum ('owner','booking_manager','technician','content_editor');
create type booking_status as enum ('pending','confirmed','in_progress','completed','cancelled','rejected','no_show');
create type pricing_type as enum ('fixed','starting_at','estimate_required','inspection_required');
create type urgency_level as enum ('standard','urgent','emergency');
create type invoice_status as enum ('draft','issued','partially_paid','paid','void');
create type quote_status as enum ('draft','sent','approved','rejected','expired');
create type payment_status as enum ('pending','succeeded','failed','refunded');
create type payment_method as enum ('cash','bank_transfer','other','gateway');
create type notif_channel as enum ('email','whatsapp','sms','in_app');
create type notif_status as enum ('queued','sent','failed','skipped');
create type publish_status as enum ('draft','published','archived');
create type moderation_status as enum ('pending','approved','rejected');
create type block_type as enum ('holiday','leave','break','maintenance','other');
create type data_request_type as enum ('correction','deletion','export');
```

---

## 3. Core Tables (reference DDL)

### 3.1 Identity
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text,                               -- E.164
  preferred_language text not null default 'en' check (preferred_language in ('en','ur')),
  is_active boolean not null default true,  -- staff deactivation
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role app_role not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index on user_roles(user_id);
```
Helpers (`SECURITY DEFINER`, `search_path = public`):
```sql
create function has_role(uid uuid, r app_role) returns boolean language sql stable security definer as
$$ select exists(select 1 from user_roles ur join profiles p on p.id=ur.user_id
                 where ur.user_id=uid and ur.role=r and p.is_active) $$;
create function is_staff(uid uuid) returns boolean language sql stable security definer as
$$ select exists(select 1 from user_roles ur join profiles p on p.id=ur.user_id
                 where ur.user_id=uid and p.is_active) $$;
```
Triggers: block inserting/deleting `user_roles` unless caller `has_role(auth.uid(),'owner')`; block removal of the **last owner**; users cannot change their own roles; every role change writes `audit_logs`.

### 3.2 Catalog
```sql
create table service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name_en text not null, name_ur text not null,
  sort_order int not null default 0, is_active boolean not null default true
);

create table services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references service_categories(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null, name_ur text not null,
  short_description_en text, short_description_ur text,
  description_en text, description_ur text,
  pricing_type pricing_type not null default 'inspection_required',
  base_price numeric(12,2) check (base_price is null or base_price >= 0),
  estimated_duration_minutes int not null default 60 check (estimated_duration_minutes between 15 and 1440),
  buffer_minutes int check (buffer_minutes is null or buffer_minutes >= 0),  -- overrides global
  is_bookable boolean not null default true,
  is_active boolean not null default true,
  sort_order int not null default 0,
  image_path text, icon_name text,
  seo_title_en text, seo_title_ur text, seo_description_en text, seo_description_ur text,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint price_required check (pricing_type in ('estimate_required','inspection_required') or base_price is not null)
);
create index on services(is_active, sort_order);

create table service_areas (
  id uuid primary key default gen_random_uuid(),
  city text not null, area text not null, postal_code text,
  name_ur text, is_active boolean not null default true, sort_order int default 0,
  unique (city, area)
);
create table service_area_restrictions (        -- optional: service available only in listed areas
  service_id uuid references services(id) on delete cascade,
  area_id uuid references service_areas(id) on delete cascade,
  primary key (service_id, area_id)
);
```

### 3.3 Scheduling
```sql
create table business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),  -- 0=Sunday
  opens_at time, closes_at time, is_closed boolean not null default false,
  unique (weekday),
  check (is_closed or (opens_at is not null and closes_at is not null and closes_at > opens_at))
);
create table holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique, name_en text not null, name_ur text, is_recurring boolean default false
);
create table technician_services (              -- eligibility
  technician_id uuid references profiles(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  primary key (technician_id, service_id)
);
create table staff_schedules (                  -- weekly pattern per technician
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null, ends_at time not null, check (ends_at > starts_at),
  unique (technician_id, weekday, starts_at)
);
create table availability_blocks (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid references profiles(id) on delete cascade,   -- null = whole business
  starts_at timestamptz not null, ends_at timestamptz not null, check (ends_at > starts_at),
  block_type block_type not null default 'other', reason text,
  created_by uuid references profiles(id), created_at timestamptz default now()
);
create index on availability_blocks(technician_id, starts_at, ends_at);
```

### 3.4 Customers and bookings
```sql
create table customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,   -- future customer accounts
  full_name text not null,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  preferred_language text default 'en',
  created_via text not null default 'website' check (created_via in ('website','staff','import')),
  is_anonymized boolean not null default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create unique index customers_phone_uq on customers(phone_e164) where not is_anonymized;

create table customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  note text not null, created_by uuid not null references profiles(id), created_at timestamptz default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  customer_id uuid not null references customers(id) on delete restrict,
  service_id uuid not null references services(id) on delete restrict,
  assigned_technician_id uuid references profiles(id) on delete set null,
  -- snapshots (history survives customer edits)
  customer_name text not null, customer_phone text not null, customer_email text,
  problem_description text not null check (char_length(problem_description) between 10 and 1000),
  address_line text not null, area_id uuid references service_areas(id), city text not null, area_name text not null, postal_code text,
  scheduled_start timestamptz not null, scheduled_end timestamptz not null,
  status booking_status not null default 'pending',
  urgency urgency_level not null default 'standard',
  estimated_amount numeric(12,2) check (estimated_amount is null or estimated_amount >= 0),
  final_amount numeric(12,2) check (final_amount is null or final_amount >= 0),
  customer_notes text, internal_notes text, cancellation_reason text, rejection_reason text,
  language text default 'en', source text default 'website',
  privacy_accepted_at timestamptz not null, terms_accepted_at timestamptz not null,
  confirmed_at timestamptz, started_at timestamptz, completed_at timestamptz, cancelled_at timestamptz,
  created_by uuid references profiles(id),            -- null = customer-created
  created_at timestamptz default now(), updated_at timestamptz default now(),
  check (scheduled_end > scheduled_start)
);
create index on bookings(status, scheduled_start);
create index on bookings(assigned_technician_id, scheduled_start);
create index on bookings(customer_id);
create index on bookings(service_id);
create index on bookings(customer_phone);
create index on bookings(scheduled_start);
alter table bookings add constraint no_technician_overlap exclude using gist (
  assigned_technician_id with =,
  tstzrange(scheduled_start, scheduled_end, '[)') with &&
) where (assigned_technician_id is not null and status in ('pending','confirmed','in_progress'));
```
Note: `scheduled_end` already includes the service buffer when written by RPC (documented) **or** buffer is added in availability queries — pick one (recommended: store job end only and apply buffer in the RPC overlap check, and keep the exclusion constraint as a hard stop on exact job overlap).

```sql
create table booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  old_status booking_status, new_status booking_status not null,
  changed_by uuid references profiles(id),   -- null = customer/system
  changed_by_type text not null default 'staff' check (changed_by_type in ('staff','customer','system')),
  note text, created_at timestamptz not null default now()
);
create index on booking_status_history(booking_id, created_at);

create table booking_attachments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,   -- null while in quarantine
  storage_path text not null unique,           -- bucket: booking-attachments (private)
  file_type text not null check (file_type in ('image/jpeg','image/png','image/webp')),
  file_size_bytes int not null check (file_size_bytes between 1 and 5242880),
  uploaded_by uuid references profiles(id), upload_session text, created_at timestamptz default now()
);

create table booking_access_tokens (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  token_hash text not null unique,            -- sha256(token || pepper); raw token never stored
  expires_at timestamptz not null, revoked_at timestamptz, last_used_at timestamptz,
  created_at timestamptz default now()
);
create table idempotency_keys (
  key text primary key, request_hash text not null, response jsonb, booking_id uuid references bookings(id) on delete set null,
  created_at timestamptz default now(), expires_at timestamptz not null default now() + interval '48 hours'
);
create table rate_limits (
  bucket text not null, window_start timestamptz not null, count int not null default 1,
  primary key (bucket, window_start)          -- bucket e.g. 'ip:<hash>:create_booking'
);
```

### 3.5 Billing
```sql
create table quotes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete restrict, customer_id uuid references customers(id),
  quote_number text unique not null, status quote_status not null default 'draft',
  subtotal numeric(12,2) not null default 0, discount numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0, tax_amount numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  valid_until date, notes text, created_by uuid references profiles(id),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  check (discount >= 0 and tax_rate between 0 and 100)
);
create table quote_items (
  id uuid primary key default gen_random_uuid(), quote_id uuid not null references quotes(id) on delete cascade,
  item_type text not null check (item_type in ('labor','material','other')),
  description text not null, quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0), line_total numeric(12,2) not null, sort_order int default 0
);

create sequence invoice_seq;
create table invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete restrict, customer_id uuid not null references customers(id),
  quote_id uuid references quotes(id),
  invoice_number text unique not null,         -- INV-YYYY-NNNN via next_invoice_number()
  status invoice_status not null default 'draft',
  subtotal numeric(12,2) not null default 0, discount numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0, tax_amount numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,   -- maintained by trigger from payments
  issue_date date, due_date date, notes text, voided_at timestamptz, void_reason text,
  created_by uuid references profiles(id), created_at timestamptz default now(), updated_at timestamptz default now(),
  check (due_date is null or issue_date is null or due_date >= issue_date)
);
create index on invoices(status, issue_date);
create table invoice_items (
  id uuid primary key default gen_random_uuid(), invoice_id uuid not null references invoices(id) on delete cascade,
  item_type text not null check (item_type in ('labor','material','other')),
  description text not null, quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0), line_total numeric(12,2) not null, sort_order int default 0
);
create table payments (
  id uuid primary key default gen_random_uuid(), invoice_id uuid not null references invoices(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0), method payment_method not null,
  status payment_status not null default 'succeeded', external_reference text,
  paid_at timestamptz not null default now(), recorded_by uuid references profiles(id), notes text,
  created_at timestamptz default now()
);
create index on payments(invoice_id); create index on payments(paid_at);
```
Rules: issued invoices (status ≠ draft) are immutable (trigger blocks UPDATE/DELETE of items/amounts); correction = void + new invoice; sum of succeeded payments cannot exceed total; trigger updates `amount_paid` and status (`partially_paid`/`paid`); no payment gateway columns are used in v1 (`method='gateway'` reserved).

### 3.6 Content
```sql
create table projects (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  title_en text not null, title_ur text not null, description_en text, description_ur text,
  category text, city text, area text,                         -- privacy: no street address
  cover_image_path text, status publish_status not null default 'draft', published_at timestamptz,
  service_id uuid references services(id) on delete set null,
  seo_title_en text, seo_title_ur text, seo_description_en text, seo_description_ur text,
  created_by uuid references profiles(id), created_at timestamptz default now(), updated_at timestamptz default now()
);
create table project_images (id uuid primary key default gen_random_uuid(), project_id uuid references projects(id) on delete cascade,
  image_path text not null, alt_en text, alt_ur text, sort_order int default 0);
create table blog_categories (id uuid primary key default gen_random_uuid(), slug text unique not null, name_en text not null, name_ur text not null);
create table blog_posts (
  id uuid primary key default gen_random_uuid(), slug text unique not null, category_id uuid references blog_categories(id) on delete set null,
  title_en text not null, title_ur text, excerpt_en text, excerpt_ur text, body_en text, body_ur text,
  cover_image_path text, author_id uuid references profiles(id), status publish_status default 'draft', published_at timestamptz,
  seo_title_en text, seo_title_ur text, seo_description_en text, seo_description_ur text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table faqs (id uuid primary key default gen_random_uuid(), category text, question_en text not null, question_ur text, answer_en text not null, answer_ur text,
  service_id uuid references services(id) on delete set null, sort_order int default 0, status publish_status default 'draft');
create table testimonials (id uuid primary key default gen_random_uuid(), author_name text not null, area text, quote_en text, quote_ur text, rating smallint check (rating between 1 and 5),
  is_verified boolean not null default false, status publish_status default 'draft', sort_order int default 0);   -- only verified+published displayed
create table reviews (
  id uuid primary key default gen_random_uuid(), customer_id uuid references customers(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null unique,           -- one review per booking
  rating smallint not null check (rating between 1 and 5), comment text check (char_length(comment) <= 1000),
  moderation_status moderation_status not null default 'pending', published_at timestamptz, moderated_by uuid references profiles(id), created_at timestamptz default now()
);
create table customer_inquiries (
  id uuid primary key default gen_random_uuid(), full_name text not null, phone_e164 text, email text, subject text, message text not null check (char_length(message) <= 2000),
  language text, status text not null default 'new' check (status in ('new','in_progress','handled','spam')),
  handled_by uuid references profiles(id), booking_id uuid references bookings(id), created_at timestamptz default now()
);
create table legal_pages (id uuid primary key default gen_random_uuid(), slug text not null check (slug in ('privacy-policy','terms')), version int not null,
  title_en text, title_ur text, body_en text, body_ur text, status publish_status default 'draft', published_at timestamptz, unique (slug, version));
```
Reviews are linked to completed bookings; reviewing requires a review token (same pattern as access token) — P1.

### 3.7 Settings, notifications, audit
```sql
create table business_settings (
  key text primary key, value jsonb not null, is_public boolean not null default false,   -- only is_public=true readable by anon
  description text, updated_by uuid references profiles(id), updated_at timestamptz default now()
);
create table notification_templates (
  id uuid primary key default gen_random_uuid(), code text not null, channel notif_channel not null, language text not null check (language in ('en','ur')),
  subject text, body text not null, is_active boolean default true, unique (code, channel, language)
);
create table notifications (
  id uuid primary key default gen_random_uuid(), booking_id uuid references bookings(id) on delete cascade, inquiry_id uuid references customer_inquiries(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('customer','staff')), recipient_user_id uuid references profiles(id),
  recipient_address text,                          -- email/phone; redacted in logs
  channel notif_channel not null, template_code text not null, payload jsonb not null default '{}',
  status notif_status not null default 'queued', attempt_count int not null default 0, next_attempt_at timestamptz default now(),
  provider_reference text, error_details text,     -- redacted, no secrets/PII
  read_at timestamptz, sent_at timestamptz, created_at timestamptz default now()
);
create index on notifications(status, next_attempt_at);
create table appointment_reminders (id uuid primary key default gen_random_uuid(), booking_id uuid not null references bookings(id) on delete cascade,
  remind_at timestamptz not null, offset_minutes int not null, notification_id uuid references notifications(id), unique (booking_id, offset_minutes));
create table audit_logs (
  id bigint generated always as identity primary key, actor_id uuid references profiles(id) on delete set null, actor_type text default 'staff',
  action text not null, entity_type text not null, entity_id text, metadata jsonb default '{}',  -- safe fields only, no secrets/PII dumps
  ip_hash text, created_at timestamptz not null default now()
);
create index on audit_logs(entity_type, entity_id); create index on audit_logs(actor_id, created_at desc);
create table data_requests (id uuid primary key default gen_random_uuid(), customer_id uuid references customers(id), request_type data_request_type not null,
  details text, status text default 'open' check (status in ('open','approved','completed','rejected')), handled_by uuid references profiles(id), created_at timestamptz default now(), completed_at timestamptz);
create table analytics_events (id bigint generated always as identity primary key, session_id text not null, event text not null, step smallint, service_id uuid, created_at timestamptz default now());
create table analytics_daily (day date not null, metric text not null, dimension text not null default '', value bigint not null, primary key (day, metric, dimension));
```
`audit_logs` is append-only (no UPDATE/DELETE grants; trigger raises on update/delete). Audited actions: login failures (summary), role changes, status changes, assignments, reschedules, price/invoice/payment changes, settings changes, exports, data requests, user create/disable.

---

## 4. Key Functions (RPC contracts)

| Function | Caller | Behavior |
|---|---|---|
| `get_available_slots(service_id, date, area_id)` | anon via Edge Fn | Returns `[{start,end,remaining}]` only. Applies hours, holidays, blocks, eligible technicians, existing bookings + buffer, notice/advance limits |
| `create_booking_tx(payload jsonb)` | service role (Edge Fn) | Advisory lock, revalidate, upsert customer by phone, insert booking + history + token + notifications; raises `SLOT_TAKEN`, `OUT_OF_AREA`, `SERVICE_UNAVAILABLE` |
| `change_booking_status(booking_id, new_status, note)` | authenticated staff / token Edge Fn | Verifies role + transition matrix (PRD §E4), sets timestamps, inserts history + audit + notification |
| `reschedule_booking(booking_id, new_start, note)` | staff / token Edge Fn | Same lock + validation; optionally resets to `pending` |
| `assign_technician(booking_id, technician_id)` | Owner/BM | Checks eligibility, schedule, overlap (constraint as backstop) |
| `generate_booking_reference()` | internal | `ABC-YYMMDD-XXXXXX`, retry on collision |
| `next_invoice_number()` | Owner/BM | `INV-YYYY-` + zero-padded `nextval` (yearly reset optional via counter table) |
| `dashboard_summary(from,to,service_id,status)` | staff | Role-aware JSON; revenue fields only returned to Owner |
| `purge_expired_data()` | cron | Expired tokens, idempotency, rate limits, stale uploads, retention-based attachment/booking anonymization |

Status-change enforcement: revoke `UPDATE (status)` on `bookings` from `authenticated`; only the RPC (SECURITY DEFINER) can change it. Transition table:

```sql
create table booking_status_transitions (from_status booking_status, to_status booking_status, allowed_roles app_role[], allow_customer boolean default false, requires_reason boolean default false, primary key(from_status,to_status));
```
Seed per PRD §E4.

---

## 5. Row Level Security (summary matrix)

`anon` = public visitor, `auth` = any signed-in staff. Policies use `has_role(auth.uid(), …)`.

| Table | anon | Owner | Booking Mgr | Technician | Content Editor |
|---|---|---|---|---|---|
| services, service_categories | SELECT where `is_active` | ALL | SELECT | SELECT | UPDATE content fields (via policy + column grants) |
| service_areas, business_hours, holidays | SELECT active/public | ALL | SELECT | SELECT | ✘ |
| business_settings | SELECT `is_public` | ALL | SELECT non-secret | ✘ | ✘ |
| customers, customer_notes | ✘ | ALL | ALL (no delete) | ✘ (only via assigned booking snapshot) | ✘ |
| bookings | ✘ (Edge Fn only) | ALL | ALL | SELECT/limited UPDATE where `assigned_technician_id = auth.uid()` | ✘ |
| booking_status_history | ✘ | SELECT | SELECT | SELECT own assigned | ✘ |
| booking_attachments | ✘ | ALL | ALL | SELECT assigned | ✘ |
| booking_access_tokens, idempotency_keys, rate_limits | ✘ | ✘ (service role only) | ✘ | ✘ | ✘ |
| quotes/invoices/items/payments | ✘ | ALL | ALL (no delete, no void without reason) | ✘ | ✘ |
| projects, blog_posts, faqs, testimonials, legal_pages | SELECT `published` | ALL | ✘ | ✘ | ALL |
| reviews | SELECT `approved` | ALL | SELECT | ✘ | moderate |
| customer_inquiries | INSERT via Edge Fn only | ALL | ALL | ✘ | ✘ |
| notifications | ✘ | ALL | ALL | own in-app | own in-app |
| profiles, user_roles | ✘ | ALL | SELECT staff basic | SELECT self | SELECT self |
| audit_logs | ✘ | SELECT | ✘ | ✘ | ✘ |
| analytics_* | INSERT events via Edge Fn | SELECT | SELECT aggregates | ✘ | content stats |

Technician column restriction: technician `UPDATE` allowed only through `change_booking_status` and a `add_job_note` RPC, not raw table updates. Technician reads use a view `technician_jobs` exposing only the fields needed (name, phone, address, problem, schedule, photos).
**Rule:** every table has RLS enabled and a default-deny posture; write policy tests per role (Doc 06 test plan).

---

## 6. Storage

| Bucket | Visibility | Content | Policy |
|---|---|---|---|
| `booking-attachments` | **private** | customer fault photos | no anon read; upload only via signed URL from Edge Fn; staff read via signed URL (15 min); Technician only for assigned bookings |
| `public-media` | public read | service, project, blog, team images | write: Owner/Content Editor; max 5 MB; image MIME only |
| `branding` | public read | logo, favicon, OG | write: Owner |
| `invoice-files` | private | generated PDFs (P1) | Owner/BM |
Path convention: `booking-attachments/{yyyy}/{mm}/{booking_id|upload_session}/{uuid}.{ext}`. Never use user-supplied filenames.

---

## 7. Settings Keys (`business_settings`)
`business.name`, `business.logo_path`, `business.phone`, `business.whatsapp`, `business.email`, `business.address`, `business.map_url`, `business.hours_note`, `site.default_language`, `site.hide_unverified`, `site.maintenance_mode`, `booking.slot_interval_minutes`(60), `booking.buffer_minutes`(30), `booking.min_notice_hours`(2), `booking.max_advance_days`(30), `booking.confirmation_mode`(manual|auto), `booking.reconfirm_on_reschedule`(true), `booking.cancel_window_hours`(4), `booking.max_per_phone_per_day`(3), `booking.urgency_enabled`(false), `booking.technician_assignment_enabled`(true), `pricing.tax_enabled`(false), `pricing.tax_rate`(0), `pricing.currency`('PKR'), `notify.reminder_offsets_minutes`([1440,120]), `retention.booking_months`(36), `retention.attachment_months`(12), `integrations.email_provider_status` (status only, not secrets), `analytics.enabled`.
All values validated by a JSON-schema check in an RPC (`update_setting`); **no secret keys stored here**.

---

## 8. Example Seed (placeholders only)
- `business_hours`: Mon–Sat 09:00–18:00, Sunday closed (placeholder; owner to confirm).
- `service_categories`: Residential, Commercial, Safety & Inspection.
- `services` (10 configurable examples from PRD §4, pricing_type `inspection_required`, no invented prices, `is_active=true`, flagged placeholder in notes).
- `notification_templates`: booking_received, booking_confirmed, booking_rescheduled, booking_cancelled, booking_rejected, reminder_24h, reminder_2h, booking_completed, tracking_link — EN + UR.
- **No** fake reviews, stats, team, licenses, or contact details.

---

## 9. Verification Queries (QA)
1. Two concurrent inserts for same technician/time → second fails (`23P01` exclusion violation).
2. `anon` select on `bookings`, `customers`, `invoices`, `payments` → 0 rows / permission denied.
3. Technician select on `bookings` returns only assigned rows.
4. Content Editor cannot read `invoices`; Booking Manager cannot read `audit_logs`/`user_roles` writes.
5. Attempt to demote last owner → error.
6. Invalid status jump (completed → pending) → `INVALID_TRANSITION`.
7. Dashboard revenue = SQL sum of `payments` (succeeded) for range; invoiced = sum of issued invoices.
8. Direct `UPDATE bookings SET status` by authenticated user → denied.
9. Public Storage URL for `booking-attachments` object → 400/403.

---

## 10. Frontend ↔ Schema Compatibility Rules
- DTO field names mirror columns (camelCase in TS, snake_case in DB).
- Frontend must not assume tables not listed here; any new table/column requested by AI Studio must be added to this spec first.
- Before running SQL: review the SQL folder ZIP against Sections 3–6 (syntax, run order, FKs, RLS, column names).
