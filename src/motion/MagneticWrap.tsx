/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — MagneticWrap Component
 * Subtle magnetic attraction on hover (max 6px).
 * Strictly gated: only active on (hover: hover) and (pointer: fine).
 * Disabled on touch screens or in reduced motion.
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from './hooks';

interface MagneticWrapProps {
  children: React.ReactNode;
  strength?: number; // max offset in px, default 5px
  className?: string;
}

export const MagneticWrap: React.FC<MagneticWrapProps> = ({
  children,
  strength = 5,
  className = '',
}) => {
  const isReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isCapable, setIsCapable] = useState(false);

  useEffect(() => {
    // Only fine pointers with true hover capability
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsCapable(media.matches);

    const handler = (e: MediaQueryListEvent) => setIsCapable(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !isCapable || isReduced) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const deltaX = (e.clientX - centerX) / (width / 2);
    const deltaY = (e.clientY - centerY) / (height / 2);

    setPosition({
      x: deltaX * strength,
      y: deltaY * strength,
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  if (!isCapable || isReduced) {
    return <div className={`inline-block ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.5 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};
