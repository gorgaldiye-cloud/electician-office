import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Phone, Shield, Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { repository } from '../../data';
import { Button } from '../ui/Button';
import { useReducedMotion, useDirection } from '../../motion/hooks';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { currentRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const isReduced = useReducedMotion();
  const dir = useDirection();
  const settings = repository.getSettings();

  useEffect(() => {
    const handleScroll = () => {
      const top = window.scrollY;
      setIsScrolled(top > 24);

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        setScrollProgress(Math.min(top / maxScroll, 1));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: t.nav.home },
    { id: 'services', label: t.nav.services },
    { id: 'pricing', label: t.nav.pricing },
    { id: 'projects', label: t.nav.projects },
    { id: 'ai-diagnostics', label: t.nav.aiDiagnostics, isSpecial: true },
    { id: 'track-booking', label: t.nav.trackBooking },
    { id: 'contact', label: t.nav.contact },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const isAdminView = currentView.startsWith('admin');

  return (
    <header className="sticky top-0 z-40 transition-all duration-200">
      {/* Top emergency & role utility strip */}
      <div className="bg-[#15191F] text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#FFC928] font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>Certified Electrician Services · Pakistan</span>
            </span>
            <span className="hidden sm:inline text-neutral-400">|</span>
            <span className="hidden sm:inline text-neutral-300">
              {language === 'ur' ? 'ہنگامی برقی امداد: ' : 'Emergency Dispatch: '}
              <a
                href={`tel:${settings.phone}`}
                className="underline hover:text-[#FFC928] font-mono-numbers transition-colors"
                dir="ltr"
              >
                {settings.phoneDisplay}
              </a>
            </span>
          </div>

          <div className="flex items-center gap-3 ms-auto">
            {/* Language Toggle with cross-fade label */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#2A313B] hover:bg-[#3D4754] text-[#FFC928] transition-colors active:scale-95"
              title="Toggle Language"
            >
              <span className="transition-opacity duration-200">
                {language === 'en' ? 'اردو' : 'English'}
              </span>
            </button>

            {/* Portal Switcher */}
            <button
              onClick={() => handleNav(isAdminView ? 'home' : 'admin-dashboard')}
              className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                isAdminView
                  ? 'bg-[#FFC928] text-[#15191F] font-semibold'
                  : 'bg-[#2A313B] text-neutral-200 hover:text-white'
              }`}
            >
              {isAdminView ? (language === 'ur' ? 'پبلک ویب سائٹ' : 'Public Site') : t.nav.adminPortal}
            </button>
          </div>
        </div>
      </div>

      {/* Main Top Bar Contract with smooth height & backdrop shift */}
      <div
        className={`bg-white/95 backdrop-blur-md border-b border-[#D5DBE1] transition-all duration-200 ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 transition-all duration-200 ${
            isScrolled ? 'h-15' : 'h-18'
          }`}
        >
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 text-start whitespace-nowrap shrink-0 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-lg bg-[#15191F] flex items-center justify-center text-[#FFC928] font-black text-xl shadow-sm group-hover:bg-[#2A313B] group-hover:shadow-[0_0_12px_rgba(255,201,40,0.3)] transition-all">
              ABC
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-[#15191F] tracking-tight leading-tight">
                {t.brand}
              </span>
              <span className="text-[11px] text-[#5B6572] font-medium leading-none">
                {language === 'ur' ? 'مصدقہ الیکٹریکل حل' : 'Electrical Contractors & Engineers'}
              </span>
            </div>
          </button>

          {/* Zone 2: Clean Nav Links with Trace Underline and Steady Glow Dot */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#2A313B]">
            {navLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNav(link.id)}
                  className={`whitespace-nowrap py-1 relative flex items-center gap-1.5 transition-colors group ${
                    isActive ? 'text-[#15191F] font-semibold' : 'text-[#5B6572] hover:text-[#15191F]'
                  } ${link.isSpecial ? 'text-amber-800 font-semibold' : ''}`}
                >
                  {link.isSpecial && <Sparkles className="w-3.5 h-3.5 text-[#E6B000]" />}
                  <span>{link.label}</span>

                  {/* Steady Yellow Glow Dot on Active Nav Link */}
                  {isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#FFC928] shadow-[0_0_6px_#FFC928] inline-block shrink-0"
                      aria-hidden="true"
                    />
                  )}

                  {/* Circuit Underline Trace on Hover/Focus */}
                  {!isReduced && (
                    <span
                      className={`absolute bottom-0 inset-x-0 h-[2px] bg-[#FFC928] origin-inline-start transition-transform duration-260 ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Quick Call Buttons */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <Button
              as="a"
              href={`tel:${settings.phone}`}
              variant="secondary"
              size="sm"
              icon={<Phone className="w-4 h-4 text-[#FFC928]" />}
            >
              <span className="font-mono-numbers" dir="ltr">
                {settings.phoneDisplay}
              </span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleNav('book-service')}
            >
              {t.nav.bookService}
            </Button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="sm:hidden px-3 py-1.5"
              onClick={() => handleNav('book-service')}
            >
              {t.nav.bookService}
            </Button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#15191F] hover:bg-[#EEF1F4] focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 1px Yellow Trace Line Growing under Header on Scroll */}
        {!isReduced && (
          <div
            className="h-[1.5px] bg-gradient-to-r from-transparent via-[#FFC928] to-transparent shadow-[0_0_6px_#FFC928] transition-opacity duration-200"
            style={{
              width: isScrolled ? '100%' : '0%',
              opacity: isScrolled ? 1 : 0,
              transformOrigin: dir === 1 ? '0% 50%' : '100% 50%',
            }}
          />
        )}
      </div>

      {/* Mobile Menu Drawer with Circuit-Line Wipe on edge and staggered items */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: dir === 1 ? '100%' : '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir === 1 ? '100%' : '-100%' }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden fixed inset-y-0 end-0 z-50 w-full max-w-xs bg-white shadow-2xl border-s border-[#D5DBE1] flex flex-col justify-between p-6"
          >
            {/* Edge circuit line */}
            <div className="absolute top-0 bottom-0 start-0 w-[2px] bg-gradient-to-b from-[#FFC928] via-[#FFE082] to-transparent" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EEF1F4] mb-4">
                <div className="font-display font-bold text-base text-[#15191F]">
                  ABC Electrician
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#15191F] hover:bg-[#EEF1F4]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {navLinks.map((link, idx) => (
                  <motion.button
                    key={link.id}
                    initial={{ opacity: 0, x: dir * 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    onClick={() => handleNav(link.id)}
                    className={`text-start px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      currentView === link.id
                        ? 'bg-[#FFF4CC] text-[#15191F] font-bold'
                        : 'text-[#2A313B] hover:bg-[#EEF1F4]'
                    } ${link.isSpecial ? 'flex items-center gap-2 text-amber-800' : ''}`}
                  >
                    {link.isSpecial && <Sparkles className="w-4 h-4 text-[#E6B000]" />}
                    <span>{link.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#EEF1F4] flex flex-col gap-2.5">
              <Button
                as="a"
                href={`tel:${settings.phone}`}
                variant="secondary"
                size="md"
                className="w-full"
                icon={<Phone className="w-4 h-4 text-[#FFC928]" />}
              >
                <span dir="ltr">
                  {language === 'ur'
                    ? `کال کریں: ${settings.phoneDisplay}`
                    : `Call Now: ${settings.phoneDisplay}`}
                </span>
              </Button>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => handleNav('book-service')}
              >
                {t.nav.bookService}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
