/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ABC Electrician Services — MobileActionBar Component
 * Slides up after first scroll or 1.5s timer.
 * Call Now button features a gentle pulse ring.
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Phone, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { repository } from '../../data';
import { Button } from '../ui/Button';
import { useReducedMotion } from '../../motion/hooks';

interface MobileActionBarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({ currentView, onNavigate }) => {
  const { language, t } = useLanguage();
  const settings = repository.getSettings();
  const isReduced = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Reveal after 1.5s or on first scroll
    const timer = setTimeout(() => setIsVisible(true), 1500);

    const handleScroll = () => {
      setIsVisible(true);
      window.removeEventListener('scroll', handleScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true, once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Hide on booking wizard and admin views so controls aren't duplicated or obscured
  if (currentView === 'book-service' || currentView.startsWith('admin')) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{
            duration: isReduced ? 0.01 : 0.28,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#D5DBE1] px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-xl"
        >
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <Button
              as="a"
              href={`tel:${settings.phone}`}
              variant="secondary"
              size="md"
              pulseRing={!isReduced}
              icon={<Phone className="w-4 h-4 text-[#FFC928]" />}
            >
              <span>{t.nav.callNow}</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('book-service')}
              icon={<Calendar className="w-4 h-4" />}
            >
              <span>{t.nav.bookService}</span>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
