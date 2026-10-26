/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — TraceBorder Component
 * SVG border that traces clockwise around elements with a Live Current surge.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useReducedMotion } from './hooks';

interface TraceBorderProps {
  children?: React.ReactNode;
  active?: boolean;
  color?: string;
  durationMs?: number;
  borderRadius?: number;
  strokeWidth?: number;
  className?: string;
}

export const TraceBorder: React.FC<TraceBorderProps> = ({
  children,
  active = false,
  color = '#FFC928',
  durationMs = 450,
  borderRadius = 10,
  strokeWidth = 1.5,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [perimeter, setPerimeter] = useState(300);
  const isReduced = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current) return;
    const { offsetWidth, offsetHeight } = containerRef.current;
    // Approximate rect perimeter
    setPerimeter(2 * (offsetWidth + offsetHeight));
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {children}

      {!isReduced && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          style={{ borderRadius }}
        >
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={`calc(100% - ${strokeWidth}px)`}
            height={`calc(100% - ${strokeWidth}px)`}
            rx={borderRadius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={perimeter}
            strokeDashoffset={active ? 0 : perimeter}
            style={{
              transition: `stroke-dashoffset ${durationMs}ms cubic-bezier(0.7, 0, 0.2, 1), opacity 200ms ease`,
              opacity: active ? 1 : 0,
              filter: `drop-shadow(0 0 4px ${color})`,
            }}
          />
        </svg>
      )}
    </div>
  );
};
