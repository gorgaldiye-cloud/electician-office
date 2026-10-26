# ABC Electrician Services — "Live Current" Motion System

## 1. Concept & Palette
- **Theme:** "Live Current" — electricity in motion.
- **Accent:** Single primary current yellow (`#FFC928`), bright spark (`#FFE082`), on dark charcoal (`#15191F` / `#2A313B`).
- **Purity:** No rainbow neon, no distracting gimmicks. Fast, crisp, engineered precision.

## 2. Motion Tokens (`tokens.css`)
- **Durations:**
  - `--motion-duration-instant: 90ms` (taps, quick press)
  - `--motion-duration-fast: 160ms` (hover, fade outs)
  - `--motion-duration-normal: 260ms` (slides, dialogs)
  - `--motion-duration-slow: 480ms` (section entrances, circuit traces)
  - `--motion-duration-circuit: 900ms` (circuit completion loops)
- **Easings:**
  - `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` (snappy decelerated entrance)
  - `--ease-circuit: cubic-bezier(0.7, 0, 0.2, 1)` (electric current pulse acceleration)
  - `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` (success pop checkmark)
- **Glow Shadows:**
  - `--glow-ring: 0 0 0 1px rgba(255, 201, 40, 0.55)`
  - `--glow-ambient: 0 0 24px rgba(255, 201, 40, 0.35)`

## 3. Motion Variants (`variants.ts`)
- `fadeUp`: Smooth entrance with 16px rise using `--ease-out`.
- `fadeIn`: Pure opacity transition (200ms).
- `powerOn`: 2-step electricity power-on reveal with subtle brightness surge (300ms).
- `traceIn`: SVG circuit path drawing (`pathLength: 0 -> 1`).
- `staggerChildren`: Orchestrates child entrances with 60ms delay intervals.
- `scaleIn`: Dialog and modal popup scaling from 0.96 to 1.
- `slideInline(dir, distance)`: RTL-safe slide that respects text direction (+1 for LTR, -1 for RTL).
- `wipeInline(dir)`: Smooth clip-path wipe in logical reading order.
- `pressDown`: Button click scale `.97` with spring return.
- `successPop`: Checkmark pop using `--ease-spring`.

## 4. Hooks (`hooks.ts`)
- `useReducedMotion()`: Respects OS `prefers-reduced-motion` AND manual toggle in footer stored in `localStorage`.
- `useLiteMode()`: Automatically detects low-resource hardware (`hardwareConcurrency <= 4` or `RAM <= 2GB` or `saveData`).
- `useDirection()`: Returns `+1` (LTR) or `-1` (RTL) for correct horizontal vector calculations.
- `useInView(threshold, triggerOnce)`: Efficient intersection observer that triggers entrances once.

## 5. Shared Components
- `<Reveal>`: Section wrapper for power-on and fade-up reveals with optional yellow trace bar.
- `<TraceBorder>`: SVG border tracing around cards and buttons.
- `<CircuitBackground>`: Static SVG grid first (zero LCP penalty), followed by idle-loaded looping current traces and dim floating spark particles.
- `<SparkBurst>`: Disperses 6 tiny electrical sparks on button press coordinates.
- `<CountUp>`: Smooth numeric counter for metrics.
- `<PageTransition>`: Current sweep across the top edge from inline-start to inline-end on route change.
- `<MagneticWrap>`: Desktop fine-pointer cursor attraction (max 5px).
- `<GlowCard>`: Card with subtle yellow current glow on hover.
- `<TextReveal>`: Typography reveal (guarantees Urdu text is NEVER split into characters to preserve Nastaliq script).
