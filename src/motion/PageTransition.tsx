/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — PageTransition Component
 * Manages route change animations:
 * - Current sweep across the top edge from inline-start to inline-end (400ms)
 * - Content fade-up with power-on entrance
 * - Focus management to <h1> and auto-scroll
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion, useDirection } from './hooks';

interface PageTransitionProps {
  currentKey: string;
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  currentKey,
  children,
}) => {
  const isReduced = useReducedMotion();
  const dir = useDirection();
  const mainRef = useRef<HTMLDivElement>(null);

  // Focus management on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: isReduced ? 'auto' : 'smooth' });

    const timer = setTimeout(() => {
      const heading = mainRef.current?.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabIndex', '-1');
        heading.focus({ preventScroll: true });
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [currentKey, isReduced]);

  if (isReduced) {
    return (
      <div ref={mainRef} key={currentKey} className="allow-fade">
        {children}
      </div>
    );
  }

  return (
    <div ref={mainRef} className="relative w-full overflow-hidden">
      {/* Top Yellow Current Line Sweep */}
      <motion.div
        key={`sweep-${currentKey}`}
        initial={{
          scaleX: 0,
          opacity: 0.8,
          transformOrigin: dir === 1 ? '0% 50%' : '100% 50%',
        }}
        animate={{
          scaleX: [0, 1, 1],
          opacity: [0.8, 1, 0],
        }}
        transition={{
          duration: 0.42,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="fixed top-0 inset-x-0 h-[2.5px] z-50 pointer-events-none bg-gradient-to-r from-transparent via-[#FFC928] to-[#FFE082] shadow-[0_0_12px_#FFC928]"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            duration: 0.24,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
