/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — GlowCard Component
 * Hover glow card with subtle Live Current border tracing and ambient glow.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion, useLiteMode } from './hooks';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(255, 201, 40, 0.35)',
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isReduced = useReducedMotion();
  const isLite = useLiteMode();

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isReduced ? {} : { y: -2 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl transition-shadow ${
        isHovered && !isReduced && !isLite
          ? 'shadow-[0_0_24px_rgba(255,201,40,0.22)]'
          : 'shadow-sm'
      } ${className}`}
    >
      {/* Subtle border glow trace on hover */}
      {!isReduced && (
        <div
          className={`absolute -inset-[1px] rounded-2xl pointer-events-none transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: `linear-gradient(135deg, ${glowColor}, transparent 60%, ${glowColor})`,
            zIndex: 0,
          }}
        />
      )}

      {/* Card Content Layer */}
      <div className="relative z-10 w-full h-full rounded-2xl bg-inherit">
        {children}
      </div>
    </motion.div>
  );
};
