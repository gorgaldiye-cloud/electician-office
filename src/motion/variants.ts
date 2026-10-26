/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — "Live Current" Motion Variants
 * Strict rules: Transform, opacity, clip-path, filter only.
 * RTL aware: Direction multiplier passed to horizontal motions.
 */

import type { Variants } from 'motion/react';

export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: [0.16, 1, 0.3, 1], // --ease-out
    },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * powerOn — Soft 2-step electricity power-on reveal.
 * Max 300ms, no rapid strobing, clean and modern.
 */
export const powerOn: Variants = {
  hidden: {
    opacity: 0,
    filter: 'brightness(0.6)',
  },
  visible: {
    opacity: [0, 0.45, 0.25, 0.9, 1],
    filter: ['brightness(0.6)', 'brightness(1.2)', 'brightness(0.8)', 'brightness(1.1)', 'brightness(1)'],
    transition: {
      duration: 0.3,
      times: [0, 0.3, 0.5, 0.8, 1],
      ease: 'easeInOut',
    },
  },
};

/**
 * traceIn — Circuit line SVG trace animation
 */
export const traceIn: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.7, 0, 0.2, 1], // --ease-circuit
    },
  },
};

/**
 * staggerChildren — Orchestration container
 */
export const staggerChildren = (staggerMs = 0.06, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerMs,
      delayChildren,
    },
  },
});

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/**
 * slideInline — Slide in along the reading direction (LTR: +x, RTL: -x)
 */
export const slideInline = (dir: number = 1, distance: number = 24): Variants => ({
  hidden: {
    opacity: 0,
    x: dir * distance,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.26,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -dir * distance,
    transition: {
      duration: 0.16,
      ease: 'easeIn',
    },
  },
});

/**
 * wipeInline — Clip-path wipe in logical reading order
 */
export const wipeInline = (dir: number = 1): Variants => ({
  hidden: {
    clipPath: dir === 1 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
    opacity: 0,
  },
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
    transition: {
      duration: 0.38,
      ease: [0.16, 1, 0.3, 1],
    },
  },
});

export const pressDown: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.01 },
  tap: {
    scale: 0.97,
    transition: { duration: 0.09, ease: 'easeOut' },
  },
};

export const successPop: Variants = {
  hidden: { scale: 0.7, opacity: 0 },
  visible: {
    scale: [0.7, 1.15, 1],
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1], // --ease-spring
    },
  },
};
