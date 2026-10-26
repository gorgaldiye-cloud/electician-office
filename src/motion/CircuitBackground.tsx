/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — CircuitBackground Component
 * Live Current electric circuit grid.
 * Rule: Static SVG grid renders first (zero LCP hit).
 * Traces and canvas particles mount on requestIdleCallback, paused off-screen.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion, useLiteMode } from './hooks';

interface CircuitBackgroundProps {
  className?: string;
  intensity?: 'dim' | 'normal';
  showParticles?: boolean;
}

export const CircuitBackground: React.FC<CircuitBackgroundProps> = ({
  className = '',
  intensity = 'normal',
  showParticles = true,
}) => {
  const isReduced = useReducedMotion();
  const isLite = useLiteMode();
  const [interactiveLoaded, setInteractiveLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isReduced) return;

    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(() => setInteractiveLoaded(true), { timeout: 1200 })
      : window.setTimeout(() => setInteractiveLoaded(true), 300);

    return () => {
      if (window.cancelIdleCallback && typeof idleId === 'number') {
        window.cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId as any);
      }
    };
  }, [isReduced]);

  // Subtle canvas particles (<= 35 particles, yellow sparks)
  useEffect(() => {
    if (!interactiveLoaded || isReduced || isLite || !showParticles) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || 800);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 600);

    const onResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', onResize);

    // Particle setup
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.4, // float upwards gently like sparks
      size: 1 + Math.random() * 1.5,
      alpha: 0.1 + Math.random() * 0.35,
    }));

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.fillStyle = `rgba(255, 201, 40, ${p.alpha})`;
        ctx.shadowColor = '#FFC928';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [interactiveLoaded, isReduced, isLite, showParticles]);

  const opacityClass = intensity === 'dim' ? 'opacity-30' : 'opacity-45';

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Static SVG Circuit Grid (instant render, zero LCP impact) */}
      <svg
        className={`w-full h-full ${opacityClass}`}
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="circuit-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(255, 201, 40, 0.08)"
              strokeWidth="0.75"
            />
            {/* Circuit junction nodes */}
            <circle cx="0" cy="0" r="1.5" fill="rgba(255, 201, 40, 0.25)" />
            <circle cx="60" cy="0" r="1.5" fill="rgba(255, 201, 40, 0.25)" />
            <path
              d="M 20 0 L 20 20 L 40 20 L 40 60"
              fill="none"
              stroke="rgba(255, 201, 40, 0.05)"
              strokeWidth="0.75"
              strokeDasharray="2, 4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit-grid)" />
      </svg>

      {/* 2. Slow Looping Current Traces (Mounted on idle) */}
      {interactiveLoaded && !isReduced && (
        <svg
          className="absolute inset-0 w-full h-full opacity-60 overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0,120 Q 250,90 500,140 T 1000,100"
            fill="none"
            stroke="#FFC928"
            strokeWidth="1.2"
            strokeDasharray="40 200"
            className="circuit-trace-pulse-1"
          />
          <path
            d="M 100,400 L 350,400 L 400,450 L 750,450"
            fill="none"
            stroke="#FFE082"
            strokeWidth="1"
            strokeDasharray="30 180"
            className="circuit-trace-pulse-2"
          />
          <path
            d="M 500,0 L 500,200 L 650,200 L 650,500"
            fill="none"
            stroke="#FFC928"
            strokeWidth="1"
            strokeDasharray="50 250"
            className="circuit-trace-pulse-3"
          />
        </svg>
      )}

      {/* 3. Canvas Particle Field (Dim spark floaters, lazy-loaded) */}
      {interactiveLoaded && !isReduced && !isLite && showParticles && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />
      )}

      {/* 4. Contrast Scrim / Charcoal Vignette (ensures >= 4.5:1 text contrast) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#15191F] via-[#15191F]/70 to-transparent pointer-events-none" />

      {/* Inline style for the slow trace keyframe animations */}
      <style>{`
        .circuit-trace-pulse-1 {
          animation: circuitTraceAnim1 8s linear infinite;
        }
        .circuit-trace-pulse-2 {
          animation: circuitTraceAnim2 10s linear infinite 1.5s;
        }
        .circuit-trace-pulse-3 {
          animation: circuitTraceAnim3 9s linear infinite 3s;
        }
        @keyframes circuitTraceAnim1 {
          0% { stroke-dashoffset: 480; opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { stroke-dashoffset: -480; opacity: 0; }
        }
        @keyframes circuitTraceAnim2 {
          0% { stroke-dashoffset: 400; opacity: 0; }
          30% { opacity: 0.7; }
          80% { opacity: 0.7; }
          100% { stroke-dashoffset: -400; opacity: 0; }
        }
        @keyframes circuitTraceAnim3 {
          0% { stroke-dashoffset: 550; opacity: 0; }
          25% { opacity: 0.75; }
          75% { opacity: 0.75; }
          100% { stroke-dashoffset: -550; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
