import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Phone, Shield, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';

import { repository } from '../../data';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { currentRole, setRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const settings = repository.getSettings();

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D5DBE1] transition-all">
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
              <a href={`tel:${settings.phone}`} className="underline hover:text-[#FFC928] font-mono-numbers" dir="ltr">
                {settings.phoneDisplay}
              </a>
            </span>
          </div>

          <div className="flex items-center gap-3 ms-auto">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#2A313B] hover:bg-[#3D4754] text-[#FFC928] transition-colors"
              title="Toggle Language"
            >
              <span>{language === 'en' ? 'اردو' : 'English'}</span>
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

      {/* Main Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 text-start whitespace-nowrap shrink-0 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-lg bg-[#15191F] flex items-center justify-center text-[#FFC928] font-black text-xl shadow-sm group-hover:bg-[#2A313B] transition-colors">
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

        {/* Zone 2: 4-5 Clean Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#2A313B]">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className={`whitespace-nowrap transition-colors py-1 relative hover:text-[#15191F] ${
                currentView === link.id
                  ? 'text-[#15191F] font-semibold after:content-[""] after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-[#FFC928]'
                  : 'text-[#5B6572]'
              } ${link.isSpecial ? 'flex items-center gap-1 text-amber-700 font-semibold' : ''}`}
            >
              {link.isSpecial && <Sparkles className="w-3.5 h-3.5 text-[#E6B000]" />}
              <span>{link.label}</span>
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Action & Quick Call */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <a
            href={`tel:${settings.phone}`}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-[#15191F] hover:bg-[#EEF1F4] transition-colors whitespace-nowrap"
          >
            <Phone className="w-4 h-4 text-[#15191F]" />
            <span className="font-mono-numbers font-semibold" dir="ltr">{settings.phoneDisplay}</span>
          </a>

          <button
            onClick={() => handleNav('book-service')}
            className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#FFC928] hover:bg-[#E6B000] text-[#15191F] shadow-sm transition-all whitespace-nowrap shrink-0 active:scale-[0.98]"
          >
            {t.nav.bookService}
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => handleNav('book-service')}
            className="sm:hidden px-3 py-1.5 rounded-md text-xs font-bold bg-[#FFC928] text-[#15191F]"
          >
            {t.nav.bookService}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#15191F] hover:bg-[#EEF1F4] focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D5DBE1] bg-white px-4 pt-3 pb-6 shadow-lg animate-in fade-in duration-200">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNav(link.id)}
                className={`text-start px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  currentView === link.id
                    ? 'bg-[#FFF4CC] text-[#15191F] font-bold'
                    : 'text-[#2A313B] hover:bg-[#EEF1F4]'
                } ${link.isSpecial ? 'flex items-center gap-2 text-amber-800' : ''}`}
              >
                {link.isSpecial && <Sparkles className="w-4 h-4 text-[#E6B000]" />}
                <span>{link.label}</span>
              </button>
            ))}

            <div className="pt-3 border-t border-[#EEF1F4] flex flex-col gap-2">
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-[#EEF1F4] text-[#15191F]"
              >
                <Phone className="w-4 h-4" />
                <span dir="ltr">{language === 'ur' ? `ابھی کال کریں (${settings.phoneDisplay})` : `Call Now: ${settings.phoneDisplay}`}</span>
              </a>

              <button
                onClick={() => handleNav('book-service')}
                className="w-full py-3 rounded-lg text-center font-bold bg-[#FFC928] text-[#15191F] shadow-sm"
              >
                {t.nav.bookService}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
