/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — Reveal Component
 * Section & element power-on/fade-up entrance.
 */

import React from 'react';
import { motion } from 'motion/react';
import { useInView, useReducedMotion } from './hooks';
import { fadeUp, powerOn, fadeIn } from './variants';

interface RevealProps {
  children: React.ReactNode;
  variant?: 'fadeUp' | 'powerOn' | 'fadeIn';
  delay?: number;
  duration?: number;
  className?: string;
  withTraceBar?: boolean;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.26,
  className = '',
  withTraceBar = false,
}) => {
  const [ref, inView] = useInView<HTMLDivElement>(0.15, true);
  const isReduced = useReducedMotion();

  if (isReduced) {
    return <div className={`allow-fade ${className}`}>{children}</div>;
  }

  const selectedVariant =
    variant === 'powerOn' ? powerOn : variant === 'fadeIn' ? fadeIn : fadeUp;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={selectedVariant}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>

      {withTraceBar && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.45, delay: delay + 0.1, ease: [0.7, 0, 0.2, 1] }}
          className="h-[2px] w-12 bg-[#FFC928] rounded-full mt-2 shadow-[0_0_8px_#FFC928] origin-inline-start"
        />
      )}
    </div>
  );
};
