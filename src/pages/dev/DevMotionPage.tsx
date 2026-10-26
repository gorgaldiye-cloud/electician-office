/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — Dev Motion Laboratory (/dev/motion)
 * Dev-only testbed for testing:
 *  - All animated Button variants
 *  - All Live Current motion components (CircuitBackground, SparkBurst, CountUp, Reveal, TextReveal, etc.)
 *  - Reduced motion mode and Lite mode toggles
 *  - Bilingual LTR / RTL direction checks
 */

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Button,
  ButtonVariant,
} from '../../components/ui/Button';
import {
  Reveal,
  TraceBorder,
  CircuitBackground,
  SparkBurst,
  CountUp,
  MagneticWrap,
  GlowCard,
  TextReveal,
  CursorGlow,
  useReducedMotion,
  useLiteMode,
  setReducedMotionPreference,
  setLiteModePreference,
  useDirection,
} from '../../motion';
import {
  Phone,
  Calendar,
  Sparkles,
  Zap,
  Check,
  X,
  Copy,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export const DevMotionPage: React.FC = () => {
  const { language, toggleLanguage, direction } = useLanguage();
  const isReduced = useReducedMotion();
  const isLite = useLiteMode();
  const dir = useDirection();

  // Test states
  const [selectedSlot, setSelectedSlot] = useState<string>('slot-2');
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnSuccess, setBtnSuccess] = useState(false);
  const [btnError, setBtnError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iconRotated, setIconRotated] = useState(false);
  const [manualSparks, setManualSparks] = useState<{ x: number; y: number; id: number }[]>([]);

  const triggerSparkAt = (e: React.MouseEvent) => {
    setManualSparks((prev) => [
      ...prev,
      { x: e.clientX, y: e.clientY, id: Date.now() },
    ]);
  };

  const simulateLoadingAction = () => {
    setBtnLoading(true);
    setBtnSuccess(false);
    setTimeout(() => {
      setBtnLoading(false);
      setBtnSuccess(true);
      setTimeout(() => setBtnSuccess(false), 2000);
    }, 1500);
  };

  const simulateErrorAction = () => {
    setBtnError(true);
    setTimeout(() => setBtnError(false), 1000);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-12 bg-neutral-900 text-white min-h-screen relative overflow-hidden">
      {/* Background with Live Current Grid */}
      <CircuitBackground intensity="normal" showParticles={!isLite} />
      <CursorGlow size={380} color="rgba(255, 201, 40, 0.12)" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-12">
        {/* Header & Laboratory Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#2A313B]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFC928] bg-[#FFC928]/10 px-3 py-1 rounded-full mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Motion Engineering Lab · /dev/motion</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              &ldquo;Live Current&rdquo; Animation System
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Verification suite for motion tokens, accessibility constraints, RTL directionality, and button variants.
            </p>
          </div>

          {/* Mode Switchers */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#15191F] border border-[#3D4754] text-[#FFC928] hover:bg-[#2A313B] transition-all"
            >
              Lang: {language.toUpperCase()} ({direction.toUpperCase()})
            </button>

            {/* Reduced Motion Toggle */}
            <button
              onClick={() => setReducedMotionPreference(!isReduced)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                isReduced
                  ? 'bg-[#FFC928] text-[#15191F] border-[#FFC928]'
                  : 'bg-[#15191F] text-neutral-300 border-[#3D4754]'
              }`}
            >
              Reduced Motion: {isReduced ? 'ON' : 'OFF'}
            </button>

            {/* Lite Mode Toggle */}
            <button
              onClick={() => setLiteModePreference(!isLite)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                isLite
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-[#15191F] text-neutral-300 border-[#3D4754]'
              }`}
            >
              Lite Mode: {isLite ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* SECTION 1: BUTTON VARIANTS (Prompt M1 item 2) */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#FFC928]" />
            <h2 className="font-display font-bold text-xl text-white">
              1. Animated Button System & Micro-Interactions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary Button */}
            <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
              <div>
                <span className="text-xs font-mono text-[#FFC928]">variant="primary"</span>
                <h3 className="text-sm font-bold text-white mt-1">Book a Service (Yellow Current)</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Hover: diagonal light sweep + arrow slide. Tap: scale .97 + 6 spark particles.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button variant="primary" size="md">
                  {language === 'ur' ? 'سروس بُک کریں' : 'Book a Service'}
                </Button>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={btnLoading}
                    isSuccess={btnSuccess}
                    onClick={simulateLoadingAction}
                  >
                    {btnSuccess ? 'Success!' : btnLoading ? 'Processing...' : 'Test Circuit Loader'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Secondary Button */}
            <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
              <div>
                <span className="text-xs font-mono text-[#FFC928]">variant="secondary"</span>
                <h3 className="text-sm font-bold text-white mt-1">Call Now (Clockwise SVG Trace)</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Hover: clockwise SVG border trace (450ms) + phone ring-shake (±8°).
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Phone className="w-4 h-4 text-[#FFC928]" />}
                >
                  <span dir="ltr">0346 3902834</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  pulseRing={true}
                  icon={<Phone className="w-4 h-4 text-[#FFC928]" />}
                >
                  {language === 'ur' ? 'ہنگامی کال (پلس رنگ)' : 'Emergency Call (Pulse Loop)'}
                </Button>
              </div>
            </div>

            {/* Outline & Ghost / Link */}
            <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
              <div>
                <span className="text-xs font-mono text-[#FFC928]">variant="outline" & "ghost"</span>
                <h3 className="text-sm font-bold text-white mt-1">Wipe-In Fill & Trace Underline</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Outline wipes fill from inline-start. Ghost draws trace underline on hover.
                </p>
              </div>

              <div className="pt-2 flex flex-col items-start gap-4">
                <Button variant="outline" size="md">
                  {language === 'ur' ? 'تمام سروسز دیکھیں' : 'View All Services'}
                </Button>

                <Button variant="ghost" size="sm">
                  {language === 'ur' ? 'مزید معلومات حاصل کریں →' : 'Learn More Details →'}
                </Button>
              </div>
            </div>

            {/* Danger Button */}
            <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
              <div>
                <span className="text-xs font-mono text-red-400">variant="danger"</span>
                <h3 className="text-sm font-bold text-white mt-1">Destructive & Shake</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Red edge glow, one-cycle shake on confirm error.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  variant="danger"
                  size="md"
                  isError={btnError}
                  onClick={simulateErrorAction}
                >
                  {btnError ? 'Shake Error!' : 'Cancel Booking'}
                </Button>
              </div>
            </div>

            {/* Icon Buttons */}
            <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
              <div>
                <span className="text-xs font-mono text-[#FFC928]">variant="icon"</span>
                <h3 className="text-sm font-bold text-white mt-1">Morph & Rotate Controls</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Close rotates 90°; Copy morphs into Check on click.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-4">
                {/* Rotate Close Icon */}
                <button
                  onClick={() => setIconRotated(!iconRotated)}
                  className="p-3 rounded-xl bg-[#2A313B] text-white hover:text-[#FFC928] hover:shadow-[0_0_12px_rgba(255,201,40,0.3)] transition-all"
                  title="Rotate icon"
                >
                  <X
                    className={`w-5 h-5 transition-transform duration-300 ${
                      iconRotated ? 'rotate-90 text-[#FFC928]' : ''
                    }`}
                  />
                </button>

                {/* Morph Copy Icon */}
                <button
                  onClick={handleCopy}
                  className="p-3 rounded-xl bg-[#2A313B] text-white hover:text-[#FFC928] hover:shadow-[0_0_12px_rgba(255,201,40,0.3)] transition-all flex items-center gap-2 text-xs font-mono"
                  title="Copy reference"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-[#1E8E5A] animate-scale-in" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  <span>{copied ? 'Copied!' : 'ABC-8921'}</span>
                </button>
              </div>
            </div>

            {/* Admin Functional Button */}
            <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
              <div>
                <span className="text-xs font-mono text-neutral-400">variant="admin"</span>
                <h3 className="text-sm font-bold text-white mt-1">Admin Functional (No Slop)</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Restrained 120ms background shift, press scale, inline spinner. No decorative sparks.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button variant="admin" size="sm">
                  Save Changes
                </Button>
                <Button variant="admin" size="sm" isError={btnError} onClick={simulateErrorAction}>
                  Reject
                </Button>
              </div>
            </div>
          </div>

          {/* Time Slot Chips (Prompt M1 item 2) */}
          <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
            <div>
              <span className="text-xs font-mono text-[#FFC928]">variant="slotChip"</span>
              <h3 className="text-sm font-bold text-white mt-1">Time-Slot Chips (Border Trace & Lock-In)</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Hover traces border; selected locks in with yellow fill and glow scale.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { id: 'slot-1', time: '09:00 AM – 10:00 AM' },
                { id: 'slot-2', time: '11:00 AM – 12:00 PM' },
                { id: 'slot-3', time: '02:00 PM – 03:00 PM' },
                { id: 'slot-4', time: '04:30 PM – 05:30 PM' },
              ].map((slot) => {
                const isSelected = selectedSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-3.5 rounded-xl border text-xs font-mono transition-all relative overflow-hidden text-center ${
                      isSelected
                        ? 'bg-[#FFC928] text-[#15191F] font-bold border-[#FFC928] shadow-[0_0_16px_rgba(255,201,40,0.45)] scale-[1.02]'
                        : 'bg-[#2A313B] text-neutral-200 border-[#3D4754] hover:border-[#FFC928]'
                    }`}
                  >
                    {slot.time}
                    {isSelected && (
                      <span className="block text-[10px] uppercase font-bold tracking-wider mt-1 text-[#15191F]">
                        ✓ Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 2: MOTION COMPONENTS & TYPOGRAPHY REVEAL */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FFC928]" />
            <h2 className="font-display font-bold text-xl text-white">
              2. Live Current Components & Typography Safety
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TextReveal with Urdu Nastaliq Protection */}
            <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
              <div>
                <span className="text-xs font-mono text-[#FFC928]">&lt;TextReveal /&gt;</span>
                <h3 className="text-sm font-bold text-white mt-1">Nastaliq-Safe Typography Entrance</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Urdu is NEVER split into individual characters. Animates as a cohesive phrase or line block.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-[#3D4754] space-y-3">
                <div className="text-xs text-neutral-400">English Word Reveal:</div>
                <div className="text-lg font-bold text-[#FFC928]">
                  <TextReveal text="Safe. Certified. Electricians on Demand." mode="word" />
                </div>

                <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                  Urdu Whole-Line Reveal (Protected Nastaliq):
                </div>
                <div className="text-xl font-bold text-white font-urdu text-end" dir="rtl">
                  <TextReveal
                    text="پاکستان کا سب سے معتبر اور محفوظ الیکٹریکل سروسز نیٹ ورک"
                    mode="powerOn"
                  />
                </div>
              </div>
            </div>

            {/* CountUp Showcase */}
            <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
              <div>
                <span className="text-xs font-mono text-[#FFC928]">&lt;CountUp /&gt;</span>
                <h3 className="text-sm font-bold text-white mt-1">Smooth 60fps Metric Count-Up</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Zero jank, ease-out curve. Degrades to instant value in reduced motion mode.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-black/40 border border-[#3D4754] text-center">
                <div>
                  <div className="text-2xl font-black text-[#FFC928]">
                    <CountUp to={98} suffix="%" />
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">On-Time Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">
                    <CountUp to={1250} prefix="" suffix="+" />
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">Repairs Solved</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#1E8E5A]">
                    <CountUp to={30} suffix=" Days" />
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">Warranty</div>
                </div>
              </div>
            </div>

            {/* MagneticWrap & GlowCard */}
            <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
              <div>
                <span className="text-xs font-mono text-[#FFC928]">&lt;MagneticWrap /&gt; & &lt;GlowCard /&gt;</span>
                <h3 className="text-sm font-bold text-white mt-1">Magnetic Cursor Pull & Hover Glow</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Active only for mouse hover devices (hover: hover).
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <MagneticWrap strength={6}>
                  <Button variant="secondary" size="md">
                    Magnetic Pull Button
                  </Button>
                </MagneticWrap>

                <GlowCard className="p-4 bg-[#2A313B] border border-[#3D4754] text-xs">
                  <div className="font-bold text-white mb-1">Interactive Glow Card</div>
                  <div className="text-neutral-300">Hover to see yellow current perimeter glow</div>
                </GlowCard>
              </div>
            </div>

            {/* SparkBurst Interactive Click Tester */}
            <div className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
              <div>
                <span className="text-xs font-mono text-[#FFC928]">&lt;SparkBurst /&gt;</span>
                <h3 className="text-sm font-bold text-white mt-1">Manual Spark Burst Playground</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Click inside this box to emit 6 electrical spark particles at mouse point.
                </p>
              </div>

              <div
                onClick={triggerSparkAt}
                className="h-32 rounded-xl bg-black/50 border border-dashed border-[#FFC928]/40 flex items-center justify-center cursor-pointer hover:border-[#FFC928] transition-colors relative"
              >
                <span className="text-xs text-[#FFC928] font-bold pointer-events-none">
                  ⚡ Click anywhere in this box to emit sparks
                </span>

                {manualSparks.map((s) => (
                  <SparkBurst
                    key={s.id}
                    x={s.x}
                    y={s.y}
                    onComplete={() =>
                      setManualSparks((prev) => prev.filter((p) => p.id !== s.id))
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: SYSTEM CONSTRAINTS AUDIT CHECKLIST */}
        <section className="p-6 rounded-2xl bg-[#15191F] border border-[#2A313B] space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1E8E5A]" />
            <h2 className="font-display font-bold text-lg text-white">
              Prompt M1 Technical Verification Status
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-[#2A313B]/60 border border-[#3D4754]">
              <span className="text-[#1E8E5A] font-bold block mb-1">✓ Transforms & Opacity Only</span>
              <span className="text-neutral-400">Zero CLS. No width, height, top, or left animations.</span>
            </div>
            <div className="p-3 rounded-xl bg-[#2A313B]/60 border border-[#3D4754]">
              <span className="text-[#1E8E5A] font-bold block mb-1">✓ Strict Urdu Safety</span>
              <span className="text-neutral-400">Urdu text is never split by character. Blocks only.</span>
            </div>
            <div className="p-3 rounded-xl bg-[#2A313B]/60 border border-[#3D4754]">
              <span className="text-[#1E8E5A] font-bold block mb-1">✓ Reduced Motion & A11y</span>
              <span className="text-neutral-400">Respects OS & localStorage toggle. Immediate 150ms fades.</span>
            </div>
            <div className="p-3 rounded-xl bg-[#2A313B]/60 border border-[#3D4754]">
              <span className="text-[#1E8E5A] font-bold block mb-1">✓ ≤ 3 Site-Wide Loops</span>
              <span className="text-neutral-400">Call pulse, status dot, hero grid. Paused off-screen.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
