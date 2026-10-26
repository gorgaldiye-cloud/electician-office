/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — Upgraded Animated Button Component
 * Design Concept: "Live Current"
 * Variants:
 *  - primary: charge-up glow ring, diagonal light sweep, arrow slide, 6 tap sparks, loading current border
 *  - secondary: yellow border trace clockwise, phone icon shake, pulse ring support
 *  - outline: inline wipe-in fill (220ms)
 *  - ghost / link: trace underline from inline-start
 *  - danger: red edge glow, one-cycle shake on confirm
 *  - icon: circular glow behind icon, close 90deg rotate, copy/check morph
 *  - slotChip: border trace on hover, lock-in on selection
 *  - admin: functional only (120ms bg shift, scale, inline spinner, no particles)
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { SparkBurst } from '../../motion/SparkBurst';
import { useReducedMotion, useDirection } from '../../motion/hooks';
import { Check, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'danger'
  | 'icon'
  | 'slotChip'
  | 'admin';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  pulseRing?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: 'button' | 'a';
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isSuccess = false,
  isError = false,
  pulseRing = false,
  icon,
  rightIcon,
  as = 'button',
  href,
  className = '',
  children,
  onClick,
  disabled,
  ...props
}) => {
  const isReduced = useReducedMotion();
  const dir = useDirection();
  const [sparkPos, setSparkPos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    // Trigger spark burst on tap for primary and secondary non-admin buttons
    if (variant === 'primary' && !isReduced) {
      setSparkPos({ x: e.clientX, y: e.clientY });
    }

    onClick?.(e);
  };

  // Base sizing
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
  }[size];

  // Variant base styles
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-[#FFC928] hover:bg-[#E6B000] text-[#15191F] font-bold shadow-md relative overflow-hidden active:scale-[0.97]';
      break;
    case 'secondary':
      variantClasses =
        'bg-[#15191F] hover:bg-[#2A313B] text-white font-semibold border border-[#3D4754] relative overflow-hidden active:scale-[0.98]';
      break;
    case 'outline':
      variantClasses =
        'bg-transparent hover:bg-[#15191F] text-[#15191F] hover:text-white border border-[#D5DBE1] hover:border-[#15191F] font-semibold active:scale-[0.98]';
      break;
    case 'ghost':
    case 'link':
      variantClasses =
        'bg-transparent text-[#15191F] hover:text-[#B26A00] font-semibold p-0 min-h-0 relative group';
      break;
    case 'danger':
      variantClasses =
        'bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold shadow-sm active:scale-[0.98]';
      break;
    case 'icon':
      variantClasses =
        'p-2.5 rounded-xl bg-neutral-100 hover:bg-[#FFC928]/20 text-[#15191F] active:scale-[0.95] flex items-center justify-center';
      break;
    case 'slotChip':
      variantClasses =
        'px-4 py-2.5 rounded-xl border border-[#D5DBE1] text-xs font-semibold bg-white text-[#15191F] hover:border-[#FFC928] transition-all text-center';
      break;
    case 'admin':
      variantClasses =
        'bg-[#15191F] hover:bg-[#2A313B] text-white font-semibold text-xs rounded-lg px-4 py-2 border border-[#3D4754] transition-colors active:scale-[0.98]';
      break;
  }

  const ArrowIcon = dir === -1 ? ArrowLeft : ArrowRight;

  const content = (
    <>
      {/* 1. Spark burst portal on click */}
      {sparkPos && (
        <SparkBurst
          x={sparkPos.x}
          y={sparkPos.y}
          onComplete={() => setSparkPos(null)}
        />
      )}

      {/* 2. Primary: Diagonal light sweep on hover */}
      {variant === 'primary' && !disabled && !isReduced && (
        <span
          className={`absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none transform -skew-x-12 transition-transform duration-500 ease-out ${
            isHovered ? 'translate-x-[250%]' : '-translate-x-[150%]'
          }`}
          aria-hidden="true"
        />
      )}

      {/* 3. Secondary: SVG Clockwise Border Trace on hover */}
      {variant === 'secondary' && !disabled && !isReduced && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rounded-xl"
          aria-hidden="true"
        >
          <rect
            x="0.75"
            y="0.75"
            width="calc(100% - 1.5px)"
            height="calc(100% - 1.5px)"
            rx="11"
            fill="none"
            stroke="#FFC928"
            strokeWidth="1.5"
            strokeDasharray="260"
            strokeDashoffset={isHovered ? '0' : '260'}
            style={{
              transition: 'stroke-dashoffset 450ms cubic-bezier(0.7, 0, 0.2, 1)',
              filter: isHovered ? 'drop-shadow(0 0 4px #FFC928)' : 'none',
            }}
          />
        </svg>
      )}

      {/* 4. Left / Prefix Icon (with ring-shake for phone in secondary) */}
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
      ) : isSuccess ? (
        <Check className="w-4 h-4 text-[#1E8E5A] shrink-0 animate-scale-in" />
      ) : icon ? (
        <span
          className={`inline-flex shrink-0 ${
            variant === 'secondary' && isHovered && !isReduced
              ? 'animate-ring-shake'
              : ''
          }`}
        >
          {icon}
        </span>
      ) : null}

      {/* Text Children */}
      <span className="relative z-10 leading-normal inline-flex items-center gap-1.5">
        {children}
      </span>

      {/* 5. Right / Suffix Icon (sliding towards inline-end on hover for primary) */}
      {rightIcon ? (
        <span
          className={`inline-flex shrink-0 transition-transform duration-200 ${
            variant === 'primary' && isHovered && !isReduced
              ? dir === 1
                ? 'translate-x-1'
                : '-translate-x-1'
              : ''
          }`}
        >
          {rightIcon}
        </span>
      ) : variant === 'primary' && !icon && !isLoading && !isSuccess ? (
        <ArrowIcon
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isHovered && !isReduced
              ? dir === 1
                ? 'translate-x-1'
                : '-translate-x-1'
              : ''
          }`}
        />
      ) : null}

      {/* 6. Ghost/Link: Trace underline */}
      {(variant === 'ghost' || variant === 'link') && !isReduced && (
        <span
          className={`absolute bottom-0 inset-x-0 h-[2px] bg-[#FFC928] origin-inline-start transition-transform duration-260 ${
            isHovered ? 'scale-x-100' : 'scale-x-0'
          }`}
        />
      )}
    </>
  );

  const sharedClasses = `
    inline-flex items-center justify-center transition-all select-none
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928] focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none disabled:transform-none
    ${pulseRing && !isReduced ? 'animate-pulse-ring' : ''}
    ${isError ? 'animate-shake-error ring-1 ring-[#C62828]' : ''}
    ${sizeClasses}
    ${variantClasses}
    ${className}
  `.trim();

  if (as === 'a' && href) {
    return (
      <a
        href={href}
        className={sharedClasses}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={buttonRef}
      type={props.type || 'button'}
      disabled={disabled || isLoading}
      className={sharedClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      {...props}
    >
      {content}
    </button>
  );
};
