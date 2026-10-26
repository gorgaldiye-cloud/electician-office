/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — SparkBurst Component
 * Disperses 6 tiny electrical spark particles from tap/click coordinates.
 * Duration: 300ms, automatically cleans up.
 */

import React, { useEffect, useState } from 'react';
import { useReducedMotion } from './hooks';

export interface SparkPoint {
  x: number;
  y: number;
  id: number;
}

interface SparkBurstProps {
  x: number;
  y: number;
  color?: string;
  onComplete?: () => void;
}

export const SparkBurst: React.FC<SparkBurstProps> = ({
  x,
  y,
  color = '#FFC928',
  onComplete,
}) => {
  const isReduced = useReducedMotion();
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(false);
      onComplete?.();
    }, 320);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (isReduced || !active) return null;

  // 6 radial directions for the spark particles
  const particles = [
    { dx: 18, dy: -12, size: 2.5 },
    { dx: -16, dy: -15, size: 2 },
    { dx: 22, dy: 10, size: 2 },
    { dx: -19, dy: 12, size: 2.5 },
    { dx: 0, dy: -24, size: 3 },
    { dx: 5, dy: 22, size: 1.5 },
  ];

  return (
    <div
      className="pointer-events-none fixed z-50 overflow-visible"
      style={{ left: x, top: y }}
      aria-hidden="true"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full block"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
            transform: 'translate(-50%, -50%)',
            animation: `sparkScatter-${i} 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
          }}
        />
      ))}
      <style>{`
        ${particles
          .map(
            (p, i) => `
          @keyframes sparkScatter-${i} {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(calc(-50% + ${p.dx}px), calc(-50% + ${p.dy}px)) scale(0);
              opacity: 0;
            }
          }
        `
          )
          .join('\n')}
      `}</style>
    </div>
  );
};
