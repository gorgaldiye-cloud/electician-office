/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — CountUp Component
 * Smooth 60fps number animation with circuit ease-out.
 * Respects reduced motion (immediate static value).
 */

import React, { useEffect, useState } from 'react';
import { useInView, useReducedMotion } from './hooks';

interface CountUpProps {
  to: number;
  from?: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  durationMs = 800,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [ref, inView] = useInView<HTMLSpanElement>(0.2, true);
  const isReduced = useReducedMotion();
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!inView) return;
    if (isReduced) {
      setValue(to);
      return;
    }

    let startTimestamp: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // Cubic bezier (.16, 1, .3, 1) approximation
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * ease);
      setValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [inView, to, from, durationMs, isReduced]);

  return (
    <span ref={ref} className={`font-mono-numbers inline-block ${className}`}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
};
