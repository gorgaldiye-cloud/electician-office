# 02 — TECHNICAL REQUIREMENTS DOCUMENT (TRD)
**Project:** ABC Electrician Services | **Stack:** React + TypeScript (Vite), Supabase, GitHub, Cloudflare

---

## 1. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Build / UI | **React 18 + TypeScript (strict) + Vite** | SPA built in Google AI Studio |
| Routing | React Router v6 (`createBrowserRouter`, lazy routes) | SPA fallback needed on Cloudflare |
| Styling | Tailwind CSS + CSS variables (design tokens) | Logical properties for RTL (`ms-*`, `me-*`, `ps-*`, `text-start`) |
| Server state | TanStack Query | Caching, retries, optimistic UI where safe |
| Forms/validation | React Hook Form + Zod | Same Zod schemas shared with Edge Functions where possible |
| i18n | i18next + react-i18next | `en`, `ur`; sets `lang` and `dir` |
| Dates | date-fns + date-fns-tz | Always `Asia/Karachi` |
| Phone | libphonenumber-js (min) | Region `PK`, store E.164 |
| Charts | Recharts | Admin analytics |
| Meta/SEO | react-helmet-async | + prerender (P1) |
| Backend | **Supabase**: Postgres, Auth, RLS, Storage, Edge Functions (Deno), pg_cron | |
| Spam protection | Cloudflare Turnstile | Verified server-side in Edge Function |
| Email | Resend (via Edge Function, key in secrets) | Replaceable adapter |
| Hosting | **Cloudflare Pages** (Vercel fallback) | |
| AI (optional, P2) | Cloudflare AI Gateway via Worker/Function | Not part of v1 |

---

## 2. Architecture

```
Browser (React SPA, EN/UR)
   │  anon key (public)        │ user JWT (staff)
   ▼                           ▼
Supabase PostgREST (RLS-protected reads of PUBLIC data and staff data)
Supabase Edge Functions  ◄── Turnstile verify, rate limit, idempotency
   │  service-role key (server-only secret)
   ▼
Postgres (RPCs with SECURITY DEFINER, constraints, triggers) ── Storage (private/public buckets)
   │
pg_cron / scheduled Edge Function → notification worker, reminders, retention purge
```

**Principles**
1. The browser never gets the service-role key or provider secrets.
2. Anonymous users cannot read `bookings`, `customers`, `invoices`, `payments`, attachments. They use Edge Functions that return minimal data.
3. Business-critical logic (availability, booking creation, status transitions, invoice numbering) lives in Postgres functions/Edge Functions, not only in React.
4. All writes by staff go through RLS-checked tables or RPCs that check role.

---

## 3. Stage-Aware Data Layer (critical for the workflow)

Per the project workflow, **Stage A builds the whole frontend with mock data and no Supabase**; Supabase is connected last. To make that swap safe:

- Create `src/data/` with **repository interfaces** (TypeScript) for each domain: `ServicesRepo`, `BookingsRepo`, `AvailabilityRepo`, `CustomersRepo`, `StaffRepo`, `ContentRepo`, `InvoicesRepo`, `SettingsRepo`, `AuthRepo`, `NotificationsRepo`, `AnalyticsRepo`.
- Stage A: `src/data/mock/*` implements them with in-memory/`localStorage`-free seeded data (clearly labeled **MOCK**).
- Stage C: `src/data/supabase/*` implements the same interfaces. A single `src/data/index.ts` picks implementation by `VITE_DATA_SOURCE` (`mock` | `supabase`).
- UI components **never** import mock data or the Supabase client directly; they use hooks (`useServices()`, `useCreateBooking()`) that call repositories.
- DTO types live in `src/types/` and must match the column names in **Doc 05** (snake_case in DB, camelCase mapped in repositories).
- Mock mode shows a small dev-only banner "Demo data" in admin so nothing mock is mistaken for production.

---

## 4. Frontend Structure

```
src/
  app/            router.tsx, providers.tsx, guards (RequireAuth, RequireRole)
  components/
    ui/           Button, Input, Select, Textarea, Checkbox, Radio, Modal, Drawer, Toast,
                  Badge, Card, Tabs, Accordion, Table, Pagination, Skeleton, EmptyState, ...
    layout/       PublicLayout, AdminLayout, Header, Footer, MobileActionBar, Sidebar, Breadcrumbs
    booking/      BookingWizard, StepService, StepProblem, StepPhotos, StepCustomer,
                  StepAddress, StepSchedule, StepUrgency, StepReview, Confirmation
    admin/        DataTable, StatCard, Charts, CalendarView, StatusBadge, StatusActions, NotesPanel
    seo/          Seo.tsx, JsonLd.tsx
  features/       services, bookings, customers, staff, availability, quotes, invoices,
                  content, settings, analytics, auth
  pages/          public/*, admin/*, errors/*
  data/           interfaces, mock/, supabase/
  i18n/           en.json, ur.json (namespaced by feature)
  lib/            phone.ts, money.ts, datetime.ts, reference.ts, permissions.ts, validators/
  styles/         tokens.css, globals.css
  types/
public/           _redirects, robots.txt, favicon, (sitemap generated)
```

Conventions: feature-based modules, components ≤ ~250 lines, no business logic in JSX, all strings via i18n keys, no hardcoded business info (read from `SettingsRepo`), absolute imports (`@/`).

---

## 5. Routing and Guards

- Public routes per PRD §D; slugs resolved by repository; unknown → 404 component.
- Language: URL prefix `/ur/...` for Urdu (and `/` for English) **or** `?lang=`; choose prefix approach for SEO/hreflang: `/` (en), `/ur/` (ur). Language stored in `localStorage` only as preference; URL is the source of truth.
- Admin routes under `/admin/*` lazy-loaded (not in public bundle). `RequireAuth` then `RequireRole(roles[])`. Guards are UX only; the server (RLS) is the authority.
- Admin pages use `noindex`.

---

## 6. Internationalization and RTL

- `document.documentElement.lang` = `en` | `ur`; `dir` = `ltr` | `rtl` updated on language change.
- Use CSS logical properties; avoid `left/right`, `ml/mr` in code. Flip directional icons (chevrons, arrows, progress) via `rtl:` utilities; do **not** flip logos, phone numbers, or media controls.
- Numbers/phones/references stay LTR inside RTL text (`<bdi>` / `dir="ltr"` spans).
- Fonts: Latin — Inter (body) + Sora or Plus Jakarta Sans (headings); Urdu — Noto Nastaliq Urdu (marketing/body, line-height ≥ 2.0) and Noto Naskh Arabic (dense admin tables/forms). Subset and `font-display: swap`; preload only the active language's primary font.
- Translation files must be complete for both languages before a phase is accepted; native-speaker review flag for marketing copy.
- Dates formatted with Gregorian calendar in `Asia/Karachi`; Urdu locale `ur-PK`; digits Latin by default.

---

## 7. Booking Engine (Technical)

### 7.1 Slot computation (`get_available_slots` RPC)
Inputs: `service_id`, `date` (Karachi local), `area_id`, optional `urgency`.
1. Load service duration `d`, buffer `b`, slot interval `i`, min-notice, max-advance from settings.
2. Reject holidays/closed days; take opening/closing from `business_hours`.
3. Generate candidate starts every `i` minutes where `start + d ≤ closing`.
4. Eligible technicians = active, qualified for service (and area), working on that weekday (`staff_schedules`), not covered by `availability_blocks`.
5. For each candidate, count technicians **free** over `[start, start+d+b)` (no overlapping active booking incl. buffer). Slot is available if `free ≥ 1` (unassigned pending bookings consume capacity pool).
6. Return `[{start, end, remaining}]` — no personal data.
Frontend caches for ≤ 30 s and **never** treats the result as final.

### 7.2 Booking creation (`create_booking` — Edge Function → RPC)
```
Edge Function create-booking
 1. Validate body with Zod; reject unknown fields.
 2. Verify Turnstile token; check honeypot.
 3. Rate limit: per IP (e.g. 10/h) and per normalized phone (e.g. 3/day) — table `rate_limits`.
 4. Normalize phone to E.164; sanitize text.
 5. Idempotency: lookup `idempotency_keys(key)`; if found return stored response.
 6. Call RPC create_booking_tx(...) (SECURITY DEFINER):
      BEGIN
        pg_advisory_xact_lock(hashtext('slot:' || local_date))
        recompute availability for [start,end+buffer); if none → RAISE 'SLOT_TAKEN'
        upsert customer by phone_e164
        insert booking (status 'pending', generated reference, retry on unique collision)
        optional auto-assign technician (least-loaded eligible)  -- exclusion constraint is the last line of defence
        insert status_history, audit_log, access token (hash), queue notifications
      COMMIT
 7. Store idempotent response; return {reference, trackingUrl(with token once)}.
```
Attachments: uploaded before submission to a quarantine path via **signed upload URLs** issued by `request-upload` function (validates count/type/size), linked to booking in the RPC; unlinked files purged after 24 h.

### 7.3 Database guarantees
- `EXCLUDE USING gist (assigned_technician_id WITH =, tstzrange(scheduled_start, scheduled_end, '[)') WITH &&) WHERE (assigned_technician_id IS NOT NULL AND status IN ('pending','confirmed','in_progress'))`.
- Check constraints: `scheduled_end > scheduled_start`, status valid, amounts ≥ 0.
- Status changes only via `change_booking_status(booking_id, new_status, note)` RPC (checks matrix + role); direct `UPDATE bookings.status` revoked via column privileges/trigger.
- Reschedule via `reschedule_booking` RPC (same lock + validation).

### 7.4 Booking reference
`ABC-` + `YYMMDD` + 6 chars from alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`; generated in DB function; unique index; retry on collision.

### 7.5 Tracking
Table `booking_access_tokens` (hash only). Edge Function `track-booking`:
- `GET ?token=` → validate hash/expiry/revoked → minimal booking view.
- `POST {reference, phone}` → always returns the same message; if match, create new token and enqueue notification. Constant-time-ish response, rate-limited per IP and per reference.
- `POST cancel/reschedule` requires token.

---

## 8. Security Specification

| Area | Requirement |
|---|---|
| Auth | Supabase Auth email+password for staff; no public signup (disable signups; admin invites). Optional TOTP MFA for Owner |
| RBAC | `user_roles` + `has_role()` helper; RLS policies per table (Doc 05 §RLS); role escalation blocked by policy + trigger; last-owner protection |
| Secrets | Service-role key, Resend key, Turnstile secret, token pepper: **Supabase Edge Function secrets only**. Frontend env: only `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`, `VITE_DATA_SOURCE` |
| Input | Zod on client and server; length limits; strip HTML; parameterized queries only; React escaping, no `dangerouslySetInnerHTML` except sanitized (DOMPurify) blog HTML/markdown |
| Uploads | allow-list MIME + magic-byte check, ≤ 5 MB, ≤ 5 files, random filenames, private bucket, signed URLs (≤ 15 min) |
| Headers | CSP (self + Supabase + Turnstile + font host), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame-ancestors none — via Cloudflare `_headers` |
| Rate limiting | `rate_limits` table in Edge Functions + Cloudflare WAF rules on `/functions` and auth |
| Enumeration | Generic responses; non-sequential IDs/references; UUID PKs |
| Logging | Audit log for sensitive actions; no PII/secrets in logs; redact phone/email in error details |
| CORS | Edge Functions allow only production + preview origins |
| Privacy | Retention job; anonymization; deletion-request workflow; consent timestamps stored on booking |
| Dependencies | `npm audit` in CI; pinned versions; Dependabot |

Prohibited: storing service-role key in frontend, relying on hidden buttons, public bucket for attachments, returning full booking rows to anon.

---

## 9. Notifications

- `notifications` table is a queue: `queued → sent/failed/skipped`, `attempt_count`, `next_attempt_at`.
- Worker (scheduled Edge Function every minute) sends via provider adapter; exponential backoff (1, 5, 30 min), max 3 attempts; failures visible in admin with redacted error and **Resend** button.
- Templates in `notification_templates` (EN/UR, placeholders `{{reference}}`, `{{date}}`, `{{tracking_url}}`); rendered server-side; unknown placeholders rejected.
- Channels v1: email (if address provided), in-app staff notification, WhatsApp **click-to-chat link** shown to staff (no API claim). SMS/WhatsApp API = P2.
- Events: booking received, confirmed, rescheduled, cancelled/rejected, reminder (24 h and 2 h before; configurable), completed, new booking alert to staff, new inquiry alert.

---

## 10. Analytics and Reporting

- Operational metrics computed with SQL views/RPCs (`dashboard_summary(from,to,filters)`) restricted by role; Owner-only financial views.
- Funnel events (`analytics_events`: `booking_started`, `step_completed`, `booking_submitted`) are anonymous, no PII, session-id random; opt-out respected; aggregated daily into `analytics_daily`.
- No third-party trackers in v1 unless the owner adds them (consent banner then required).

---

## 11. SEO Technical Requirements

- Unique `<title>`, description, canonical, OpenGraph/Twitter, `hreflang` en/ur for each public page.
- JSON-LD: `Electrician`/`LocalBusiness` (only configured data), `Service`, `FAQPage`, `Article`, `BreadcrumbList`.
- `sitemap.xml` and `robots.txt` generated at build from DB slugs (build script or Cloudflare Function).
- **SPA caveat:** pure client rendering weakens SEO. P1 mitigation: prerender public routes at build (e.g., `vite-plugin-ssg`/prerender script) or a Cloudflare Pages Function injecting meta for crawlers. Decide in Phase 9; document result.
- Core Web Vitals budget: JS initial ≤ 200 KB gz public bundle; images responsive `srcset`, explicit width/height, lazy-loaded below the fold; LCP image preloaded.

---

## 12. Error Handling and Observability

- Global error boundary; route-level boundaries; typed API errors `{code, message, field?}` (e.g., `SLOT_TAKEN`, `RATE_LIMITED`, `VALIDATION_FAILED`, `INVALID_TRANSITION`, `FORBIDDEN`).
- User-facing messages localized; technical details never shown.
- Offline/slow network: retry with backoff, visible state; booking draft retained.
- Server logs via Supabase logs; optional Sentry (P1) with PII scrubbing.

---

## 13. Testing Strategy

| Level | Tooling | Must cover |
|---|---|---|
| Unit | Vitest | phone normalization, money, datetime (Karachi), reference, permissions, slot UI logic |
| Component | Testing Library | forms, wizard steps, RTL rendering |
| E2E | Playwright | booking flow EN/UR, tracking, admin login, role restrictions |
| DB | pgTAP or SQL scripts | exclusion constraint, concurrent booking, RLS per role, transition matrix |
| Security | manual checklist | enumeration, IDOR, upload abuse, XSS, rate limits |
| Accessibility | axe + manual keyboard/screen reader | all public pages and wizard |
| Performance | Lighthouse CI | Home, Service, Book |

Concurrency test: fire 20 parallel `create-booking` calls for one last slot → exactly 1 success.

---

## 14. Environment Variables

**Frontend (`.env`, safe to expose):**
```
VITE_DATA_SOURCE=mock|supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_TURNSTILE_SITE_KEY=
VITE_SITE_URL=
```
**Supabase Edge Function secrets (server only):** `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `TOKEN_PEPPER`, `ALLOWED_ORIGINS`.
Provide `.env.example` with no real values.

---

## 15. Deployment (GitHub → Cloudflare)

Flow: **AI Studio final remix → ZIP review → new GitHub repo → Cloudflare Pages "Import from GitHub"** (Vercel fallback).

**Cloudflare Pages settings**
| Setting | Value |
|---|---|
| Framework preset | Vite (or React/None) |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | set `NODE_VERSION` env (e.g., 20) and `engines` in package.json |
| Env vars | the `VITE_*` values above |

**Build-failure prevention checklist (from previous experience)**
1. Check the ZIP for `bun.lock` / `bun.lockb`; **delete them** and keep only `package-lock.json` so Cloudflare uses npm.
2. Add root file `.npmrc` containing exactly: `legacy-peer-deps=true`
3. `public/_redirects` containing `/* /index.html 200` (SPA refresh without 404).
4. `public/_headers` for security headers.
5. Verify `package.json` scripts (`build`: `tsc -b && vite build` or `vite build`), no unused/conflicting lock files, Node version compatible.
6. Verify the list of environment variables is set in Cloudflare.
7. After deploy, test on the `*.pages.dev` subdomain: refresh on deep routes, EN/UR switch, booking, admin login, headers.

Edge Functions are deployed to Supabase (Supabase CLI or dashboard); migration SQL files run in order in SQL Editor (Doc 05 §Migration order).

---

## 16. Backup, Retention, Operations
- Supabase daily backups (verify plan includes it); export SQL schema into repo.
- Retention job (pg_cron): purge expired tokens, idempotency keys (48 h), rate-limit rows, stale uploads, attachments per policy; anonymize deleted-request customers.
- Maintenance mode flag in settings; status page = P2.
- Runbook: rotate keys, add admin, restore backup, disable a technician, resend failed notification.

---

## 17. Out-of-Scope Technical Items (v1)
Payment gateways, SMS gateway, native apps, SSR framework migration (Next.js), realtime tracking maps, AI features. Keep interfaces open (`NotificationProvider`, `PaymentProvider`) for P2.
