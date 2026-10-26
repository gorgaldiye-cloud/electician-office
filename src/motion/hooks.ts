/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — Motion Hooks
 * Provides responsive, accessible controls for animation states.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

const REDUCED_MOTION_KEY = 'abc_reduced_motion';
const LITE_MODE_KEY = 'abc_lite_mode';

/**
 * useReducedMotion
 * Combines OS preference (prefers-reduced-motion: reduce) with the user's
 * explicit manual preference in localStorage.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(REDUCED_MOTION_KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(REDUCED_MOTION_KEY) === null) {
        setReduced(e.matches);
        document.documentElement.setAttribute('data-reduced-motion', String(e.matches));
      }
    };

    const handleCustomChange = () => {
      const stored = localStorage.getItem(REDUCED_MOTION_KEY);
      const val = stored !== null ? stored === 'true' : mediaQuery.matches;
      setReduced(val);
      document.documentElement.setAttribute('data-reduced-motion', String(val));
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    window.addEventListener('abc_motion_settings_change', handleCustomChange);

    document.documentElement.setAttribute('data-reduced-motion', String(reduced));

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('abc_motion_settings_change', handleCustomChange);
    };
  }, [reduced]);

  return reduced;
}

/**
 * Helper to toggle reduced motion and notify app
 */
export function setReducedMotionPreference(enabled: boolean) {
  localStorage.setItem(REDUCED_MOTION_KEY, String(enabled));
  document.documentElement.setAttribute('data-reduced-motion', String(enabled));
  window.dispatchEvent(new CustomEvent('abc_motion_settings_change'));
}

export function isReducedMotionStored(): boolean | null {
  const stored = localStorage.getItem(REDUCED_MOTION_KEY);
  return stored !== null ? stored === 'true' : null;
}

/**
 * useLiteMode
 * Detects low-spec devices (concurrency <= 4, RAM <= 2GB, or Save-Data header)
 * to disable heavy canvas particle simulations and complex multi-layer blurs.
 */
export function useLiteMode(): boolean {
  const [isLite, setIsLite] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(LITE_MODE_KEY);
    if (stored !== null) return stored === 'true';

    const lowCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    const lowMemory = typeof (navigator as any).deviceMemory === 'number' && (navigator as any).deviceMemory <= 2;
    const saveData = (navigator as any).connection?.saveData === true;

    return lowCores || lowMemory || saveData;
  });

  useEffect(() => {
    const handleCustomChange = () => {
      const stored = localStorage.getItem(LITE_MODE_KEY);
      if (stored !== null) {
        setIsLite(stored === 'true');
        document.documentElement.setAttribute('data-lite-mode', stored);
      }
    };

    window.addEventListener('abc_motion_settings_change', handleCustomChange);
    document.documentElement.setAttribute('data-lite-mode', String(isLite));

    return () => {
      window.removeEventListener('abc_motion_settings_change', handleCustomChange);
    };
  }, [isLite]);

  return isLite;
}

export function setLiteModePreference(enabled: boolean) {
  localStorage.setItem(LITE_MODE_KEY, String(enabled));
  document.documentElement.setAttribute('data-lite-mode', String(enabled));
  window.dispatchEvent(new CustomEvent('abc_motion_settings_change'));
}

/**
 * useDirection
 * Returns +1 for LTR and -1 for RTL.
 * Multiplier for horizontal transform offsets.
 */
export function useDirection(): number {
  const { direction } = useLanguage();
  return direction === 'rtl' ? -1 : 1;
}

/**
 * useInView
 * Intersection observer hook that triggers once when element enters threshold (default 0.2).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  threshold: number = 0.2,
  triggerOnce: boolean = true
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(el);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return [ref, isInView];
}
