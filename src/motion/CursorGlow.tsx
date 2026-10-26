/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — CursorGlow Component
 * Subtle yellow cursor glow for hero and CTA bands.
 * Strictly gated:
 *  - Only on (hover: hover) and (pointer: fine)
 *  - Disabled in reduced-motion or lite mode
 *  - Throttled via requestAnimationFrame (no layout trashing)
 */

import React, { useRef, useState, useEffect } from 'react';
import { useReducedMotion, useLiteMode } from './hooks';

interface CursorGlowProps {
  className?: string;
  size?: number;
  color?: string;
}

export const CursorGlow: React.FC<CursorGlowProps> = ({
  className = '',
  size = 320,
  color = 'rgba(255, 201, 40, 0.08)',
}) => {
  const isReduced = useReducedMotion();
  const isLite = useLiteMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isCapable, setIsCapable] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsCapable(media.matches);

    const handler = (e: MediaQueryListEvent) => setIsCapable(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isCapable || isReduced || isLite) return;

    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return; // throttle to next animation frame
      rafId = requestAnimationFrame(() => {
        const rect = parent.getBoundingClientRect();
        setPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        rafId = null;
      });
    };

    const handleMouseLeave = () => {
      setPos(null);
    };

    parent.addEventListener('mousemove', handleMouseMove, { passive: true });
    parent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isCapable, isReduced, isLite]);

  if (!isCapable || isReduced || isLite || !pos) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute pointer-events-none inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute rounded-full transition-opacity duration-300 pointer-events-none blur-3xl"
        style={{
          width: size,
          height: size,
          left: pos.x - size / 2,
          top: pos.y - size / 2,
          backgroundColor: color,
        }}
      />
    </div>
  );
};
