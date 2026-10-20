import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Phone, Calendar } from 'lucide-react';
import { repository } from '../../data';

interface MobileActionBarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({ currentView, onNavigate }) => {
  const { language, t } = useLanguage();
  const settings = repository.getSettings();

  // Hide on booking wizard and admin views so controls aren't duplicated or obscured
  if (currentView === 'book-service' || currentView.startsWith('admin')) {
    return null;
  }

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#D5DBE1] px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-xl">
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <a
          href={`tel:${settings.phone}`}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold bg-[#15191F] text-white hover:bg-[#2A313B] active:scale-[0.98] transition-all"
        >
          <Phone className="w-4 h-4 text-[#FFC928]" />
          <span>{t.nav.callNow}</span>
        </a>

        <button
          onClick={() => onNavigate('book-service')}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold bg-[#FFC928] text-[#15191F] hover:bg-[#E6B000] active:scale-[0.98] shadow-sm transition-all"
        >
          <Calendar className="w-4 h-4" />
          <span>{t.nav.bookService}</span>
        </button>
      </div>
    </div>
  );
};
