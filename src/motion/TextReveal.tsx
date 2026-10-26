/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — TextReveal Component
 * Handles typography power-on reveals.
 * 
 * STRICT RULE:
 * NEVER split Urdu text into letters/characters (breaks Nastaliq joining).
 * In Urdu mode, reveals animate whole lines or full blocks only.
 * In English mode, reveals can animate word-by-word with electric trace.
 */

import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useInView, useReducedMotion } from './hooks';

interface TextRevealProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  className?: string;
  delay?: number;
  mode?: 'word' | 'line' | 'powerOn';
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  as: Component = 'span',
  className = '',
  delay = 0,
  mode = 'powerOn',
}) => {
  const { language } = useLanguage();
  const [ref, inView] = useInView<HTMLDivElement>(0.1, true);
  const isReduced = useReducedMotion();

  // If reduced motion or plain power-on, do a soft whole-block power-on
  if (isReduced) {
    return <Component className={className}>{text}</Component>;
  }

  // Urdu ALWAYS stays as whole-block or whole-line (no character splitting)
  if (language === 'ur' || mode === 'powerOn') {
    return (
      <Component ref={ref as any} className={`inline-block ${className}`}>
        <motion.span
          className="inline-block"
          initial={{ opacity: 0, filter: 'brightness(0.7)' }}
          animate={
            inView
              ? {
                  opacity: [0, 0.5, 0.3, 0.95, 1],
                  filter: ['brightness(0.7)', 'brightness(1.2)', 'brightness(0.8)', 'brightness(1)'],
                }
              : { opacity: 0 }
          }
          transition={{
            duration: 0.35,
            delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {text}
        </motion.span>
      </Component>
    );
  }

  // English word-by-word stagger
  const words = text.split(' ');

  return (
    <Component ref={ref as any} className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden whitespace-nowrap me-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: '100%', opacity: 0 }}
            animate={inView ? { y: '0%', opacity: 1 } : { y: '100%', opacity: 0 }}
            transition={{
              duration: 0.28,
              delay: delay + i * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Component>
  );
};
