# 04 — UI/UX DESIGN BRIEF
**Project:** ABC Electrician Services — premium, trustworthy, bilingual (EN LTR / UR RTL), mobile-first.

---

## 1. Design Principles
1. **Trust first:** clean, honest, no fake badges/stats/reviews. Placeholders are visibly marked in dev and hidden in production until approved.
2. **Speed to action:** Call Now and Book Service reachable in one tap everywhere.
3. **Safety-aware tone:** calm, professional, clear. Yellow = energy/action, charcoal = authority.
4. **Premium restraint:** generous whitespace, few effects, strong typography, real photography.
5. **True bilingual:** Urdu is a first-class layout (RTL), not translated text in an LTR shell.
6. **Accessible by default:** WCAG 2.2 AA.

---

## 2. Design Tokens

### 2.1 Color
| Token | Hex | Use |
|---|---|---|
| `--color-charcoal-900` | #15191F | Headings, header/footer bg, primary text on light, buttons text on yellow |
| `--color-charcoal-700` | #2A313B | Secondary dark surfaces, admin sidebar |
| `--color-charcoal-500` | #5B6572 | Secondary text (≥ 4.5:1 on white) |
| `--color-yellow-500` | #FFC928 | Primary accent, primary button background |
| `--color-yellow-600` | #E6B000 | Hover for yellow |
| `--color-yellow-100` | #FFF4CC | Subtle highlight bg |
| `--color-white` | #FFFFFF | Surfaces |
| `--color-grey-100` | #EEF1F4 | Page section backgrounds, inputs bg alt |
| `--color-grey-300` | #D5DBE1 | Borders |
| `--color-success` | #1E8E5A | Success (text on white ≥ 4.5:1) |
| `--color-warning` | #B26A00 | Warning text; bg `#FFF1D6` |
| `--color-error` | #C62828 | Error; bg `#FDE8E8` |
| `--color-info` | #1F5FBF | Info; bg `#E6EFFB` |

**Contrast rules:** charcoal on yellow ✔ (~11:1); charcoal on white ✔; **never yellow text on white** (fails); yellow only as fill/accent line/icon on dark. Verify all pairs with a contrast tool in Phase 1.

### 2.2 Typography
| Role | Latin (EN) | Urdu (UR) |
|---|---|---|
| Headings | Sora or Plus Jakarta Sans, 600–700 | Noto Nastaliq Urdu 600–700 |
| Body | Inter 400/500 | Noto Nastaliq Urdu 400 (public site) |
| Admin/dense UI | Inter | Noto Naskh Arabic (better for tables/small text) |
| Mono (refs) | JetBrains Mono / ui-monospace | same, LTR |

Scale (mobile → desktop): H1 32→56, H2 26→40, H3 22→28, H4 18→22, body 16→18, small 14, caption 12 (not below 12; admin min 13).
Line-height: EN body 1.6, headings 1.2; **UR body 2.0, headings 1.7** (Nastaliq needs vertical room). Max line length 65–75 characters. Letter-spacing none for Urdu.

### 2.3 Spacing, radius, shadow
- Spacing (4-pt): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Section padding: 64 mobile / 96–128 desktop. Container max 1200 px (admin 1440).
- Radius: sm 6, md 10 (inputs/buttons), lg 16 (cards), xl 24 (hero images), full (chips).
- Shadows: `sm` 0 1px 2px rgba(21,25,31,.08); `md` 0 6px 20px rgba(21,25,31,.10); `lg` 0 16px 40px rgba(21,25,31,.14). Use sparingly; prefer borders on admin.

### 2.4 Breakpoints
`xs <480`, `sm 480–767`, `md 768–1023` (tablet), `lg 1024–1279`, `xl ≥1280`. Mobile-first CSS; test 360×800, 390×844, 768×1024, 1280×800, 1440×900.

### 2.5 Motion
150–250 ms ease-out for hover/focus; 300 ms for drawers/modals; subtle fade-up on scroll once per element; **respect `prefers-reduced-motion`** (disable transforms). No auto-playing carousels, no parallax.

### 2.6 Iconography
One consistent line-icon set (e.g., Lucide) 24 px grid, 1.75 stroke; electrical-themed icons for services (bolt, plug, switch, fan, bulb, shield, gauge, tools, building, home). **Per the workflow, icons are finally delivered as images (PNG/SVG) in Stage B**; during Stage A use the icon library as stand-ins with a stable `<Icon name>` wrapper so replacement is one place. Directional icons mirror in RTL; logos/media/clock/phone do not.

### 2.7 Light/dark
Public site: light theme only (v1). Dark charcoal is used for header/footer/CTA bands/hero overlays. Admin: light default; dark mode P2. Never place body text over images without ≥ 4.5:1 overlay.

---

## 3. Components and States

### 3.1 Buttons
| Variant | Style | Use |
|---|---|---|
| Primary | bg yellow-500, text charcoal-900, bold; hover yellow-600; radius md; min height 48 | Book a Service, Submit, Confirm |
| Secondary | bg charcoal-900, text white; hover charcoal-700 | Call Now, Next |
| Outline | border charcoal-900, transparent; hover grey-100 | Details, Back |
| Ghost/Link | text charcoal-900 underline-on-hover | Tertiary |
| Danger | bg error, text white | Cancel booking, delete |
| Sizes | sm 36, md 44–48, lg 56 | Mobile tap target ≥ 44×44 |
States for all: default, hover, **focus-visible** (2 px charcoal ring + 2 px yellow outer offset ring, never removed), active (pressed -1px/darker), disabled (opacity .5, `aria-disabled`, no pointer), loading (spinner + same width, label retained for SR "Loading").

### 3.2 Form controls
Height 48, border 1 px grey-300, radius md, label above (never placeholder-only), helper text under, error text in error color **with icon** (not color alone) and `aria-describedby`, required marked with text "(required)"/"(لازمی)". Focus: border charcoal + ring. Phone field: LTR input with `+92` prefix chip and helper "03XX XXXXXXX". Date picker: touch-friendly date strip + calendar modal. Slot chips: selectable pills, disabled = strikethrough + tooltip "Booked". File upload: dashed dropzone, thumbnails, progress, remove button. Checkbox/radio ≥ 24 px hit area 44.
States: default, hover, focus, filled, error, success, disabled, read-only.

### 3.3 Cards
- **Service card:** image 4:3, icon badge, bilingual name, 2-line description, duration, actions (**no price chip**; optional small "Charges after live inspection" caption). Hover: lift 2 px + shadow md.
- **Project card:** 3:2 image, category chip, title, location (city-level).
- **Testimonial card:** quote, first name + area, stars (only real).
- **Stat/KPI card (admin):** label, value, delta, sparkline; loading skeleton.
- **Booking card (mobile admin/technician):** time, service, area, status badge, quick actions.

### 3.4 Navigation
Desktop: sticky header 72 px, logo start, links center (Home, Services, Pricing, Projects, About, Contact; More: Reviews, FAQ, Blog), language switch, phone, **Book a Service** button. Shrinks to 60 px on scroll with shadow.
Mobile: logo + language + hamburger → full-height drawer; **sticky bottom action bar** 64 px (Call Now secondary | Book Service primary) with `padding-bottom: env(safe-area-inset-bottom)`; page content gets matching bottom padding; bar hides on booking wizard (replaced by wizard footer controls) and while keyboard open.
Admin: left sidebar (collapsible, charcoal-700) with role-filtered items; top bar with search, notifications, user menu; mobile → bottom nav for technician (My jobs, Calendar, Profile).
RTL: sidebar moves to the right; breadcrumbs reverse; chevrons mirror.

### 3.5 Other components (inventory)
Header, Footer, MobileActionBar, Breadcrumbs, LanguageSwitch, Hero, SectionHeading, ServiceCard, ProcessSteps (Book → Visit → Repair), TrustBadge (only approved), ProjectCard + Lightbox, TestimonialCard, FAQAccordion, AreaList, CTABand, Stepper/ProgressBar, SlotPicker, DateStrip, PhoneInput, FileDropzone, PriceLabel, StatusBadge, Timeline (booking history), DataTable (sort/filter/paginate/empty/loading), CalendarView, StatCard, Charts (line/bar), Modal, Drawer, ConfirmDialog, Toast, Tabs, Tooltip, Skeleton, EmptyState, ErrorState, Pagination, RichTextEditor (bilingual), ImageUploader, PermissionGate, InvoicePrintLayout, LanguageField (EN/UR tabs).

**StatusBadge colors:** pending = warning, confirmed = info, in_progress = yellow/charcoal, completed = success, cancelled = grey, rejected = error, no_show = charcoal outline.

### 3.6 Feedback states
Loading skeleton (shimmer disabled under reduced motion), empty state (icon + explanation + action), success (green check + next step), warning, error (plain language + retry), disabled. Toasts bottom-center mobile / top-end desktop, `role="status"`, auto-dismiss 5 s (errors persist).

---

## 4. Accessibility Requirements
- Contrast: text 4.5:1, large text/UI components 3:1.
- Keyboard: all interactions, visible focus, logical order (mirrors in RTL), skip-to-content link, focus trap in modals/drawers, Esc closes.
- Semantics: landmarks, one H1 per page, labels, `aria-live` for validation/booking results, wizard step announced ("Step 3 of 9").
- Touch targets ≥ 44 px; no hover-only functionality; no time limits.
- Images: meaningful alt text in the page language; decorative `alt=""`.
- Zoom to 200% without loss; no horizontal scroll at 320 px.
- Don't convey status by color only.
- Urdu: tested with screen reader (TalkBack/VoiceOver) where possible; correct `lang="ur"` on mixed content segments.

---

## 5. Imagery and Media
- Style: authentic electrical work — technicians (real, with safety gear), distribution boards, wiring, switches, lighting, home interiors, commercial spaces. Avoid generic stock clichés and anything unsafe (bare hands on live wires). No fake team portraits.
- Placeholders (Stage A): neutral charcoal/grey blocks with icon, labeled "Image placeholder".
- Aspect ratios: Hero 16:9 desktop / 4:5 mobile crop; service card 4:3; project card 3:2; gallery 3:2 / 1:1 thumbs; team 1:1; blog cover 16:9; OG image 1200×630; logo SVG/PNG transparent.
- Delivery: WebP/AVIF with JPG fallback, `srcset` (480/768/1200/1600), `loading="lazy"` except LCP, explicit `width/height` (no layout shift), `object-fit: cover`, max 200 KB each for cards, 300 KB hero.
- The full **Stage B Image List** (ID, name, page, section, purpose, real/AI, format, pixel size, transparency, desktop/mobile note, AI prompt) will be generated after the frontend is complete, in the table format defined in the workflow.

---

## 6. RTL / LTR Behavior
| Topic | Rule |
|---|---|
| Direction | `dir="rtl"` on `<html>` for UR; use logical CSS properties everywhere |
| Layout | Grids and flex rows flip automatically; hero image side swaps; sidebar to the right |
| Icons | Mirror arrows/chevrons/progress/back; do not mirror logo, phone, clock, check, media icons |
| Text | Alignment `start`; Urdu headings not uppercase; no letter-spacing; avoid italic |
| Numbers | Latin digits default; phone numbers, references, prices numerals in `dir="ltr"` `<bdi>` |
| Forms | Labels right-aligned; phone/email inputs LTR with `text-align:start` placeholder handling |
| Mixed content | Wrap English brand names/numbers in `<bdi>`; test "ABC" inside Urdu sentences |
| Fonts | Taller line-height; avoid clipping descenders in buttons/badges (min padding 10 px vertical in UR) |
| Animation | Slide-in directions reverse |
| QA | Every phase includes an RTL screenshot review at 360 and 1280 widths |

---

## 7. Wireframes (descriptions)

### 7.1 Homepage — Desktop (≥1280)
```
┌──────────────────────────────────────────────────────────────┐
│ [Logo ABC]  Home Services Pricing Projects About Contact  EN|اردو  📞  [Book a Service] │  72px sticky
├──────────────────────────────────────────────────────────────┤
│ HERO (charcoal bg, image right 50%)                          │
│  "Powering Your Home. Safely. Reliably."   [real photo]      │
│  Professional Electrical Services You Can Trust.             │
│  [Book a Service]  [Call Now]                                │
├──────────────────────────────────────────────────────────────┤
│ Featured Services: 3×2 ServiceCards          [View all →]    │
├──────────────────────────────────────────────────────────────┤
│ Why choose ABC: 4 icon cards (placeholders until approved)   │
├──────────────────────────────────────────────────────────────┤
│ Process: ① Book  →  ② Visit  →  ③ Repair  (connected line)   │
├──────────────────────────────────────────────────────────────┤
│ Trust indicators (hidden if none)  │ Completed Projects 3 cards │
├──────────────────────────────────────────────────────────────┤
│ Testimonials (hidden if none)                                │
├──────────────────────────────────────────────────────────────┤
│ FAQ accordion (5)  │ Service Areas list + map link           │
├──────────────────────────────────────────────────────────────┤
│ CTA band (yellow): "Need an electrician?" [Book] [Call]      │
├──────────────────────────────────────────────────────────────┤
│ Footer (charcoal): logo, links, contact, areas, legal, lang  │
└──────────────────────────────────────────────────────────────┘
```
### 7.2 Homepage — Tablet (768–1023)
Two-column grids, hero stacked (text above image), hamburger menu still visible, no sticky bottom bar above 768? **Keep sticky bar up to 1023**, hide at ≥1024.

### 7.3 Homepage — Mobile (360–479)
```
[☰] [Logo]            [EN|اردو]
HERO: headline, subtext, [Book a Service] full-width, [Call Now] full-width, image below (4:5)
Services: horizontal scroll cards or 1-col list (6) + "View all"
Why ABC: 1-col stacked icon rows
Process: vertical steps with line
Projects: swipe carousel (manual)
FAQ: accordion
Areas: chips
CTA band
Footer (accordion groups)
[ 📞 Call Now ] [ Book Service ]   ← sticky bar with safe-area padding
```

### 7.4 Booking Wizard
Desktop: centered 720 px card, left vertical stepper (9 steps) or top progress; right side "Summary" sticky (service, date/time, estimate disclaimer). Mobile: top progress "Step 4 of 9", single field group per screen, fixed bottom `Back | Next` controls (replace global sticky bar). Slot picker: horizontal date strip (14 days) + grid of 2–3 columns of time chips.

### 7.5 Service Detail
Hero (image, name, duration, [Book this service] [Call Now 0346 3902834]) → Overview → What's included → Process → **Inspection notice (charges after live inspection)** → FAQ → Related services → sticky CTA (mobile).

### 7.6 Admin Dashboard (desktop)
```
┌────────┬─────────────────────────────────────────────────────┐
│Sidebar │ Topbar: search | date range | 🔔 | user              │
│(role-  ├─────────────────────────────────────────────────────┤
│filtered│ KPI row: Total | Pending | Today | Confirmed | Completed | Cancelled │
│items)  │ Finance row (Owner): Invoiced | Collected | Outstanding | Conversion  │
│        │ Charts: Bookings trend │ Revenue trend                │
│        │ Top services │ Upcoming appointments │ Recent inquiries│
└────────┴─────────────────────────────────────────────────────┘
```
Tablet: sidebar collapses to icons. Mobile: hamburger drawer; KPI cards 2-up; tables become card lists.

### 7.7 Admin Booking Detail
Header (reference, status badge, action buttons by role) → 2-column: left (customer snapshot, problem, photos, address, notes) / right (schedule + reschedule, technician assignment, price/quote/invoice, history timeline, notifications log).

### 7.8 Technician "My jobs" (mobile)
Date tabs (Today/Tomorrow/Upcoming) → job cards (time, area, service, status) → detail with big **Start job / Complete job** buttons, tap-to-call, tap-to-map.

---

## 8. Content and Tone
- EN: plain, confident, short sentences. UR: natural conversational Urdu (not literal translation), reviewed by a native speaker.
- CTA vocabulary: "Book a Service" / «سروس بُک کریں»; "Call Now" / «ابھی کال کریں» (final wording to be approved).
- Safety copy conservative and generic; no legal/insurance claims.
- Prices: **never shown publicly.** Use the fixed notice "Charges will be confirmed after a live inspection." / «چارجز لائیو انسپیکشن کے بعد بتائے جائیں گے۔» (component `InspectionNotice`). PKR amounts appear only in staff-issued quotes/invoices and admin.
- Placeholders: `[BUSINESS_ADDRESS]`, `[LICENSE_NUMBER]` etc.; production build hides sections that still contain placeholders if setting `hide_unverified=true`. **Business phone is set: `0346 3902834` (`+923463902834`), shown LTR in all languages.**

---

## 9. UX Acceptance Checklist (per phase)
- Matches tokens; no ad-hoc colors/sizes.
- 360 px, 768 px, 1280 px verified; no horizontal scroll.
- RTL verified; mirrored icons; numbers LTR.
- All states present (loading, empty, error, success, disabled).
- Keyboard + focus check; axe has no serious issues.
- Sticky mobile bar never covers content or form controls.
- No fabricated claims; placeholders labeled.
- Animations subtle and reduced-motion safe.
