# 01 — PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Project:** ABC Electrician Services — Premium Bilingual Business Website & Management Platform
**Version:** 1.0 | **Market:** Pakistan | **Languages:** English (LTR), Urdu (RTL) | **Currency:** PKR | **Timezone:** Asia/Karachi

> Companion documents: 02 TRD, 03 App Flow, 04 UI/UX Design Brief, 05 Backend Schema, 06 Implementation Plan.
> Rule for the whole project: **no invented business facts.** Address, phone, email, logo, hours, prices, staff, qualifications, guarantees, statistics, reviews and certifications are not supplied yet. Every such value is a clearly marked placeholder (e.g. `[BUSINESS_PHONE]`) and must be editable from Admin → Settings.

---

## A. Executive Summary

### A1. Product overview
A premium website for an electrician business serving residential and commercial customers, combining (1) a public bilingual website, (2) a real database-backed online booking engine, (3) a secure role-based admin dashboard for bookings, technicians, quotes, invoices, content and analytics.

### A2. Business problem
Electrical customers in Pakistan typically find providers by word of mouth or phone calls. Pain points: no trust signals, no price clarity, hard to schedule, no tracking, urgent faults handled by chat/phone chaos. The business has no central record of bookings, technicians, quotes and invoices.

### A3. Proposed solution
A trustworthy, fast, mobile-first website that explains services, lets customers request a time slot in under 3 minutes (in English or Urdu), and gives staff one place to confirm, assign, quote, invoice and report.

### A4. Primary objectives
1. Attract customers (local SEO, bilingual content).
2. Explain services professionally.
3. Convert visitors to inquiries and bookings.
4. Online appointment requests with real availability.
5. Staff manage bookings and technician assignment.
6. Manage services, schedules, customers, projects, quotes, invoices, notifications.
7. Track performance with honest analytics.
8. Build trust without fabricated claims.
9. Allow future growth (more technicians, areas, services).

### A5. Target audience
Homeowners and tenants, shop/office/commercial property managers, people with urgent faults, mobile-first users (majority on Android phones, variable connectivity), Urdu-first and English-comfortable users.

### A6. Key differentiators
Genuine RTL Urdu experience; real slot availability (not a contact form); secure booking tracking; honest pricing language ("starting at", "inspection required"); photo upload of the fault; WhatsApp/Call shortcuts everywhere.

### A7. Major risks
| Risk | Mitigation |
|---|---|
| Double booking | DB-level exclusion constraint + transactional RPC + advisory lock |
| Unauthorized exposure of customer data | RLS, token-based tracking, no reference-only access |
| SPA SEO weakness (React on Cloudflare) | Per-route meta, sitemap, prerender of public routes (P1) |
| Urdu typography/RTL bugs | Logical CSS properties, RTL QA checklist per phase |
| Fabricated claims creeping in | Placeholder policy + content approval flag |
| AI Studio quota/remix breaking structure | Strict phase prompts, Remix Continuation Prompt (see Doc 06) |
| Notification failure (email/WhatsApp provider) | Queue + retry + visible failure state in admin |
| Mock data mistaken for finished features | Feature status table (Section C) |

### A8. Success criteria (measured after launch, targets to be set by owner)
- Booking form completion rate and median completion time (target: ≤ 3 minutes).
- Zero confirmed double-bookings.
- Mobile Lighthouse: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95 on public pages.
- 100% of admin actions server-authorized (verified by negative tests).
- Owner can change any business detail without a developer.

### A9. Scope boundaries
**In scope:** everything in P0/P1 below.
**Out of scope (v1):** online card payments/gateway (JazzCash, Easypaisa, bank cards), native mobile apps, customer login accounts (guest booking + tracking link only), live chat, multi-branch management, inventory/stock, GPS tracking, automated SMS (needs provider + PTA-compliant sender ID).

### A10. Assumptions and unresolved business decisions
| # | Decision needed from owner | Default used until answered |
|---|---|---|
| 1 | Booking confirmation rule | Manual confirm by Booking Manager (setting: `manual` \| `auto`) |
| 2 | Default slot length / buffer | 60 min slots, 30 min buffer between jobs |
| 3 | Working hours | Mon–Sat 09:00–18:00 placeholder, Sunday closed |
| 4 | Service cities/areas | Admin-defined; empty until set |
| 5 | Emergency (urgent) service offered? | Urgency field hidden unless enabled |
| 6 | Customer cancellation window | Free cancel/reschedule ≥ 4 hours before start |
| 7 | Tax (GST/sales tax) applicable? | Tax disabled by default; configurable % field |
| 8 | Email provider | Resend (configurable); WhatsApp = click-to-chat links only |
| 9 | Data retention | Bookings 3 years, attachments 12 months after completion (configurable) |
| 10 | Real photos/logo availability | Placeholders; Stage B image workflow |

---

## B. Personas and User Types

### B1. Residential customer — "Ayesha / Bilal, homeowner"
- **Goals:** Fix a fault safely, know approximate cost, pick a convenient time.
- **Needs:** Plain language, Urdu option, photo upload, confirmation she can show family.
- **Frustrations:** Unknown prices, technicians not arriving, unclear identity of visitor.
- **Permissions:** Public; can track/reschedule/cancel only own booking via secure link.
- **Journey:** Google search → Service page → Book → Confirmation (WhatsApp/email) → Track → Visit.
- **Accessibility/language:** Urdu default possible; large tap targets; works on slow 4G; 16px+ body text.

### B2. Commercial customer — "Shop / office manager"
- **Goals:** Installation, maintenance, inspection; formal quote and invoice.
- **Needs:** Quote request with detailed description, multiple-visit scheduling, printable invoice.
- **Frustrations:** No paperwork, no accountability, no maintenance schedule.
- **Permissions:** Same public rights; quotes shared via secure link.
- **Journey:** Commercial service page → Request quote/inspection → Review quote → Approve → Job → Invoice.

### B3. Urgent-assistance customer
- **Goals:** Immediate help (sparks, burning smell, no power, short circuit).
- **Needs:** One-tap **Call Now**, WhatsApp, safety advice shown first ("switch off main breaker if safe"), urgent booking option.
- **Frustrations:** Long forms, no answer.
- **Journey:** Sticky mobile call bar → phone, or fast urgent form (3 fields minimum: name, phone, area).
- **Note:** Website must not promise response times unless the owner configures them.

### B4. Business owner / Super Admin
- **Goals:** See the business at a glance, control staff and money, change content.
- **Needs:** Honest revenue numbers, audit trail, full settings control.
- **Permissions:** Everything. Only role able to manage users/roles and settings.
- **Journey:** Login → Dashboard → Pending bookings → Assign → Review revenue → Settings.

### B5. Booking manager
- **Goals:** Confirm, schedule and assign quickly; handle customer communication.
- **Needs:** Calendar + table, conflict warnings, quick WhatsApp link, notes.
- **Permissions:** Bookings, customers (contact + address), assignments, quotes/invoices; **no** user/role management, **no** business settings, no audit logs.

### B6. Electrician / technician
- **Goals:** See today's jobs, address, problem photos, mark progress.
- **Needs:** Mobile-friendly list, tap-to-call, tap-to-navigate, big status buttons, Urdu UI option.
- **Permissions:** Only bookings assigned to them; customer name/phone/address for those bookings only; can set In Progress / Completed and add job notes; no revenue, no other customers.

### B7. Content editor
- **Goals:** Maintain services text, projects, blog, FAQs, testimonials, SEO.
- **Permissions:** Content modules only; no bookings, customers, revenue, invoices, settings.

---

## C. Functional Scope and Priorities

**Status legend for implementation:** `UI-MOCK` (frontend with static data, Stage A) → `LIVE` (Supabase-backed, Stage C). A feature is only "done" when `LIVE` and tested. Mock data is never a completed production feature.

### C1. P0 — Essential for secure functional launch
| ID | Feature |
|---|---|
| P0-01 | Public pages: Home, Services, Service detail, Book, Contact, Privacy, Terms, 404/error |
| P0-02 | English + Urdu with true RTL |
| P0-03 | Multi-step booking with server-validated slot availability, transactional creation, double-booking prevention |
| P0-04 | Booking reference + secure tracking (token-based) |
| P0-05 | Booking statuses, history, audit log |
| P0-06 | Admin auth, RBAC (4 roles), server-enforced (RLS) |
| P0-07 | Admin: bookings (table + detail), assign technician, status changes, notes |
| P0-08 | Admin: services CRUD, business hours, holidays, service areas |
| P0-09 | Customer records (guest-created, dedup by normalized phone) |
| P0-10 | Pakistani phone validation/normalization (E.164) |
| P0-11 | Rate limiting + spam protection (Turnstile + server limits) + attachment validation |
| P0-12 | Notification queue (email) with failure handling |
| P0-13 | Business settings editable (no hardcoded business info) |
| P0-14 | Privacy-safe handling of customer data, retention settings |
| P0-15 | Dashboard KPIs from real queries |

### C2. P1 — Important for first production release
Calendar view; technician schedules/blocks; quotes and invoices with printable layout; payment recording (manual: cash/bank transfer); projects, reviews (moderated), FAQs, blog, pricing page; customer inquiries; reminders; analytics charts; CSV export (permissioned); SEO (sitemap, JSON-LD, prerender); Technician mobile "My jobs" view; data correction/deletion request workflow; image optimization.

### C3. P2 — Future
Payment gateways; SMS/WhatsApp Business API; customer accounts; PDF invoice generation server-side (if not P1); recurring maintenance contracts; AI chatbot via Cloudflare AI Gateway; multi-branch; inventory; review request automation; Google Reviews import; advanced analytics.

### C4. Minimum viable production release
All P0 + P1 items for bookings, content and invoices-recording. P1 items marked "if time allows": blog, reviews automation, CSV export.

---

## D. Public Website Requirements (per route)

Common to **all pages:** header (logo, nav, language switch EN/اردو, Call Now, Book a Service), footer (services links, contact placeholders, service areas, privacy, terms, language switch), sticky mobile action bar (Call Now + Book Service) that reserves bottom padding so content is never obscured, skeleton loading, friendly error state, breadcrumbs (inner pages), per-page SEO title/description/OpenGraph/canonical/hreflang, `lang` and `dir` set on `<html>`.

### D1. `/` Homepage
- **Hero:** Headline "Powering Your Home. Safely. Reliably." / Urdu equivalent (translation to be reviewed by native speaker). Support text "Professional Electrical Services You Can Trust." Primary CTA "Book a Service" → `/book-service`; Secondary "Call Now" → `tel:` of configured number. Hero image = real photo or placeholder.
- **Sections in order:** Featured services (from DB, 6 cards) → Why choose ABC (configurable bullet cards; placeholders until approved) → Service process: Book → Visit → Repair → Trust indicators (only genuine, approved; section hidden if none) → Completed projects (published only) → Testimonials (approved only; hidden if none) → FAQs (top 5) → Service areas → Contact CTA band → Footer.
- **Mobile:** single column, hero CTA full-width, sticky bar.
- **States:** skeleton cards; empty sections auto-hide.
- **SEO:** `LocalBusiness`/`Electrician` JSON-LD populated only from settings; title "Electrician Services in [City] | ABC Electrician Services".
- **Acceptance:** all copy exists in EN+UR; no fake numbers; CTA links work; Lighthouse targets met.

### D2. `/services`
Grid of active services grouped by category, category filter chips, search. Card: image, bilingual name, short description, pricing label ("Starting at PKR X" / "Inspection required"), duration, "Book" and "Details". Empty state if no services.

### D3. `/services/[slug]`
Hero + description, what's included, pricing block (with disclaimer: "Estimate only; final price confirmed after inspection"), duration, service area restrictions, process, related services, FAQs for the service, sticky "Book this service" CTA (preselects service). 404 for unknown/inactive slug. `Service` JSON-LD.

### D4. `/book-service` (see Section E)

### D5. `/pricing`
Table/cards from services' pricing types; explanation of Fixed / Starting at / Estimate / Inspection; labor vs material note; call-out-fee placeholder (only if configured); "Request a quote" CTA. Never implies guarantee.

### D6. `/about`
Business story, team (only real staff the owner publishes), qualifications/licenses (placeholders until verified), values, service area, CTA.

### D7. `/projects` and `/projects/[slug]`
Filterable gallery (category). Detail: title, description, category, location at city/area level only (no street address), image gallery with lightbox, related service links. Only `published` shown.

### D8. `/reviews`
Moderated published reviews with rating and first name/initial. Summary computed from real approved reviews only. Empty state: invitation to leave a review after a completed booking (P1). No external fabricated reviews.

### D9. `/faq`
Accordion by category, searchable, bilingual; `FAQPage` JSON-LD.

### D10. `/blog`, `/blog/[slug]`
List with category/tag, pagination; article with reading time, author, related posts, `Article` JSON-LD. Hidden from nav if no published posts.

### D11. `/contact`
Configurable phone, WhatsApp, email, address, hours, map link; inquiry form (name, phone, email optional, subject, message, Turnstile); success + error states; saves to `customer_inquiries`, notifies staff.

### D12. `/track-booking`
Two entry modes: (a) secure link with token from confirmation message → full view; (b) form with reference + phone → returns **generic** response and sends a fresh link to the phone/email on file (never displays details directly). Shows status timeline, schedule, service, assigned technician first name (if enabled), estimated price with disclaimer; actions: reschedule, cancel (rules apply). Rate-limited.

### D13. `/privacy-policy`, `/terms`
Editable from admin (EN/UR), versioned, last-updated date. Legal text must be reviewed by a qualified person before launch; placeholders flagged.

### D14. Error pages
Custom 404 (search + links), 500/error boundary, offline notice, maintenance mode page (setting).

---

## E. Customer Booking System

### E1. Journey (steps)
1 Select service → 2 Describe problem → 3 Optional photos (max 5, JPG/PNG/WebP, ≤ 5 MB each) → 4 Customer details → 5 Address and area → 6 Date and time slot → 7 Urgency (if enabled) → 8 Review (service, estimated price, terms, privacy acknowledgement) → 9 Submit → 10 Confirmation page with reference → 11 Notifications → 12 Tracking, reschedule, cancel.

On mobile: one step per screen, progress indicator, back button preserves data, draft saved in `sessionStorage` (no sensitive photos).

### E2. Fields
| Field | Rule |
|---|---|
| Full name | required, 2–80 chars |
| Phone | required; accepts `03XXXXXXXXX`, `3XXXXXXXXX`, `+923XXXXXXXXX`, `00923XXXXXXXXX`, spaces/dashes; normalized to `+923XXXXXXXXX` (mobile). Landlines optional setting |
| Email | optional (required only if email-only notifications chosen) |
| Service | required, active & bookable |
| Problem description | required, 10–1000 chars |
| Address line | required, 5–200 |
| Area + city | required, from active service areas; out-of-area → friendly message + contact option |
| Postal code | optional |
| Preferred date/slot | required, validated server-side |
| Urgency | configurable: standard / urgent / emergency |
| Attachments | optional |
| Privacy acknowledgement | required; Terms acceptance required |
| Honeypot + Turnstile | hidden/automatic |

### E3. Business rules
- All times stored as `timestamptz` (UTC) and interpreted/displayed in **Asia/Karachi**. The UI never uses the browser timezone.
- **Availability** = business hours − holidays − technician blocks − existing active bookings (± buffer), per service duration; capacity = number of eligible active technicians (or 1 if tech assignment disabled).
- Settings: slot interval (default 60), buffer (30), min notice (2 h; urgent may bypass), max advance (30 days), max bookings/day/customer phone (3).
- **Server revalidation** on submit inside a transaction (advisory lock + exclusion constraint). If the slot was taken: return `SLOT_TAKEN` with refreshed slots; UI keeps all data.
- **Idempotency:** client sends `Idempotency-Key`; repeated submissions return the same booking.
- **Booking reference:** `ABC-YYMMDD-XXXXXX` (random base32, no ambiguous chars), unique, non-sequential.
- **Confirmation rule:** a booking is `pending` on submission. It becomes `confirmed` only when the configured rule is met (manual approval, or auto-confirm if the slot was valid and a technician is assigned). Customer message must say "request received" until confirmed.
- **Cancellation/reschedule by customer:** via token link, allowed in `pending`/`confirmed` if ≥ cancellation window before start; otherwise "contact us". Reschedule re-runs availability and, per setting, returns booking to `pending`.
- **Attachments:** server checks MIME by magic bytes, extension allow-list, size, count; private bucket; signed URLs short-lived; EXIF GPS stripped (P1).
- **Failed notifications:** never block the booking; queue retries (3 attempts, backoff), status visible in admin, manual resend.
- **Retention/privacy:** configurable; deletion/correction request flow; attachments auto-purged per retention.

### E4. Booking statuses and transitions
Statuses: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `rejected`, `no_show`.

| From → To | Allowed actors | Requirements | Customer notified |
|---|---|---|---|
| (new) → pending | Customer (public), staff | valid slot | Yes: received |
| pending → confirmed | Owner, Booking Manager | slot still valid; (technician assigned if setting) | Yes |
| pending → rejected | Owner, Booking Manager | reason required | Yes |
| pending → cancelled | Customer (token), Owner, BM | reason (staff) | Yes |
| confirmed → in_progress | Assigned Technician, BM, Owner | on/after scheduled day | Optional |
| confirmed → cancelled | Customer (window), BM, Owner | reason | Yes |
| confirmed → no_show | BM, Owner | after scheduled start | Optional |
| confirmed → pending | System only (on customer reschedule if re-confirm is on) | — | Yes |
| in_progress → completed | Assigned Technician, BM, Owner | final amount optional; notes | Yes |
| in_progress → cancelled | BM, Owner | reason required | Yes |
| completed / rejected / cancelled / no_show → any | **Invalid** (Owner-only "reopen" is P2) | — | — |

Every transition writes `booking_status_history` and `audit_logs` with actor, old/new status, note, timestamp. Invalid transitions return `409 INVALID_TRANSITION`, enforced by DB function/trigger, not only UI.

### E5. Pricing behavior
Types: fixed, starting_at, estimate_required, inspection_required. Estimated amount shown with label "Estimated – not a final invoice". Final amount set by staff after work/quote. Quotes and invoices support labor/material lines, discounts, optional tax %. PKR formatting `PKR 1,500` / Urdu `1,500 روپے`. Estimates are **never** counted as revenue.

### E6. Tracking security
- Token: 32 random bytes, only SHA-256 hash stored, expiry (default 30 days or until completion + 7 days), revocable, rate-limited.
- Reference alone shows nothing; reference + phone only triggers sending a new link (generic response "If this booking exists, we sent a link" to prevent enumeration).
- Tracking responses expose minimum data (first name, status, schedule, service); full address only masked (area/city).

---

## F. Admin Dashboard Requirements

### F1. Routes and access
| Route | Owner | Booking Mgr | Technician | Content Editor |
|---|---|---|---|---|
| `/admin/login` | ✔ | ✔ | ✔ | ✔ |
| `/admin/dashboard` | full | operational (no revenue) | "My jobs" | content summary |
| `/admin/bookings`, `/[id]` | ✔ | ✔ | assigned only | ✘ |
| `/admin/customers`, `/[id]` | ✔ | ✔ | ✘ (sees details only inside assigned booking) | ✘ |
| `/admin/services`, `/new`, `/[id]` | ✔ | view | ✘ | ✔ (content fields) |
| `/admin/staff` | ✔ | view | ✘ | ✘ |
| `/admin/availability` | ✔ | ✔ | own schedule view | ✘ |
| `/admin/service-areas` | ✔ | view | ✘ | ✘ |
| `/admin/projects`, `/reviews`, `/blog`, `/faqs` | ✔ | ✘ (reviews view) | ✘ | ✔ (reviews moderate: Owner/Editor) |
| `/admin/quotes`, `/invoices` | ✔ | ✔ | ✘ | ✘ |
| `/admin/notifications` | ✔ | ✔ | ✘ | ✘ |
| `/admin/analytics` | ✔ | limited (no revenue) | ✘ | content stats only |
| `/admin/settings` | ✔ | ✘ | ✘ | ✘ |
| `/admin/users` | ✔ | ✘ | ✘ | ✘ |
| `/admin/audit-logs` | ✔ | ✘ | ✘ | ✘ |

Unauthorized route → redirect to dashboard with "no permission"; data endpoints independently return 403 / empty by RLS.

### F2. Dashboard
Cards: total bookings, pending, today's appointments, confirmed, completed, cancelled, **invoiced**, **collected**, **outstanding**, booking conversion (defined below), top services, upcoming appointments, recent inquiries. Charts: bookings trend, revenue trend (Owner). Filters: date range, service, status. Skeletons, empty states.

**Metric definitions**
- *Estimated pipeline* = Σ `estimated_amount` of pending/confirmed (informational only).
- *Recorded revenue* = Σ invoice totals if invoice exists, else `final_amount`, for `completed` bookings, by completion date.
- *Invoiced* = Σ totals of invoices with status issued/partially_paid/paid by issue date.
- *Collected* = Σ successful `payments` by payment date (net of refunds).
- *Outstanding* = Invoiced − Collected.
- *Booking conversion rate* = submitted non-spam bookings ÷ unique visitors who reached `/book-service` step 1 (from analytics events). If analytics disabled, the card shows "Not available" rather than a guess.
- *Fulfilment rate* = (confirmed + completed) ÷ submitted bookings.

### F3. Booking management
Table (search by reference/name/phone, filters: status/date/service/city/technician, sort, pagination) and calendar (day/week/month, drag-to-reschedule with conflict check). Detail page: customer snapshot, problem, photos (signed URLs), status actions, reschedule, technician assignment (shows eligible & free technicians), internal notes (never shown to customer), quote/invoice section, status history, notification log, cancel reason. Export: Owner only (and permission-flagged), logged.

### F4. Customers
Profile, contacts, booking history, internal notes (Owner/BM), created-by (customer vs staff), duplicate-phone detection and merge (Owner), data correction and deletion-request workflow (anonymize rather than destroy where invoices exist).

### F5. Services
Create/update/deactivate/reorder; EN/UR names + descriptions; slug (auto, unique, editable); category; pricing type and price; duration; images; SEO; bookable flag; area restrictions; preview.

### F6. Staff and availability
Staff accounts, role assignment (Owner only), technician weekly schedule, breaks, holidays, blocked periods, service eligibility, deactivation (soft; history preserved), overlap prevention.

### F7. Quotes and invoices
Quote with line items (labor/material), qty, unit price, discount, optional tax, status (draft/sent/approved/rejected/expired); convert to invoice; invoice number `INV-YYYY-NNNN` (gapless via sequence function); issue/due date; payment status (unpaid/partial/paid/void); manual payment records (cash, bank transfer, other) with actor; printable HTML layout (browser print to PDF); invoice history/immutability after issue (void + reissue). **No payment gateway is claimed.**

### F8. Content management
Projects + galleries, blog, FAQs, testimonials/reviews, homepage blocks, contact details, privacy/terms; EN/UR fields; SEO fields; draft/published/archived; preview.

### F9. Settings (Owner only)
Business identity, contacts, hours, holidays, areas, default language, currency, timezone (locked to Asia/Karachi v1), booking rules, pricing defaults, notification templates, retention, integrations (status only; **secrets live in server environment, never shown or editable in client UI**).

---

## G. Role-Based Access Control Matrix
✔ full | ◐ limited | ✘ none

| Capability | Owner | Booking Mgr | Technician | Content Editor |
|---|---|---|---|---|
| View bookings | ✔ | ✔ | ◐ assigned only | ✘ |
| Create bookings (staff) | ✔ | ✔ | ✘ | ✘ |
| Update booking status | ✔ | ✔ | ◐ in_progress/completed on assigned | ✘ |
| Assign technicians | ✔ | ✔ | ✘ | ✘ |
| View customer contact | ✔ | ✔ | ◐ assigned jobs | ✘ |
| View customer address | ✔ | ✔ | ◐ assigned jobs | ✘ |
| Manage services | ✔ | ✘ (view) | ✘ | ◐ content fields only |
| Manage staff / roles | ✔ | ✘ | ✘ | ✘ |
| View revenue | ✔ | ✘ | ✘ | ✘ |
| Create quotes/invoices | ✔ | ✔ | ✘ | ✘ |
| Record payments | ✔ | ✔ | ✘ | ✘ |
| Edit content | ✔ | ✘ | ✘ | ✔ |
| Business settings | ✔ | ✘ | ✘ | ✘ |
| Export data | ✔ | ◐ bookings, if granted | ✘ | ✘ |
| View audit logs | ✔ | ✘ | ✘ | ✘ |

Rules: enforced by Postgres RLS and Edge Functions; a user cannot change own role; the last Owner cannot be removed/demoted; role changes are audited; sessions expire (admin 8 h idle 30 min); optional MFA for Owner (P1).

---

## H. Non-Functional Requirements
- **Performance:** LCP < 2.5 s on 4G mid-range Android; images WebP/AVIF with lazy loading; route-level code splitting.
- **Accessibility:** WCAG 2.2 AA; keyboard navigable; visible focus; form labels/errors announced; Urdu text sizing.
- **Security:** HTTPS, CSP, no secrets in frontend, input validation (zod client + server), RLS on all tables, rate limits, audit logs, dependency scanning.
- **Privacy:** minimal data collection, consent notice, retention, deletion workflow, redacted logs.
- **Reliability:** idempotent writes, retry queue, graceful degradation (show call/WhatsApp if booking API down).
- **Browser support:** last 2 versions of Chrome, Safari, Edge, Firefox; Android Chrome and iOS Safari.
- **Localization:** all strings in i18n files; no hardcoded text in components; Urdu digits optional (setting), Latin digits default.

---

## I. Acceptance Criteria Summary (release gate)
1. Every route in Section D renders in EN and UR with correct direction.
2. A booking can be created end-to-end, appears in admin, can be confirmed, assigned, completed, invoiced and paid (manually).
3. Two simultaneous submissions for the last slot result in exactly one booking.
4. Reference number alone never reveals personal data.
5. Each role can only perform actions in the RBAC matrix (negative tests pass).
6. Dashboard numbers equal manual SQL checks on seed data.
7. No placeholder or unverified claim visible in production without owner approval flag.
8. Lighthouse and accessibility targets met on Home, Service, Book pages.
9. Backups and restore tested; admin user and secrets verified.
