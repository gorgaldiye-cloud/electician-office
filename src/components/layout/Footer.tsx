import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Phone, Mail, MapPin, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { repository } from '../../data';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const settings = repository.getSettings();
  const services = repository.getServices();
  const areas = repository.getServiceAreas().slice(0, 8);

  return (
    <footer className="bg-[#15191F] text-neutral-300 border-t border-[#2A313B] pt-14 pb-24 lg:pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#2A313B]">
          {/* Col 1: Brand & Safety Mission */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#FFC928] text-[#15191F] flex items-center justify-center font-black text-lg">
                ABC
              </div>
              <span className="font-display font-bold text-lg text-white">
                {t.brand}
              </span>
            </div>

            <p className="text-sm text-neutral-400 leading-relaxed">
              {language === 'ur'
                ? 'پاکستان میں بجلی کے کام کے لیے مستند، پیشہ ورانہ اور محفوظ ترین حل۔ تصدیق شدہ ٹیکنیشنز، جدید آلات اور شفاف قیمتیں ہمارا اعزاز ہے۔'
                : 'Certified electrical contractors serving residential and commercial properties across Pakistan with strict safety compliance, calibrated diagnostic tools, and upfront transparent pricing.'}
            </p>

            <div className="flex items-center gap-2 text-xs text-[#FFC928] bg-[#2A313B]/70 p-3 rounded-lg border border-[#3D4754]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#FFC928]" />
              <span>
                {language === 'ur'
                  ? 'تمام کام بین الاقوامی الیکٹریکل سیفٹی کوڈز کے مطابق کیا جاتا ہے۔'
                  : 'All work adheres to Pakistan & IEEE electrical safety standards.'}
              </span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 tracking-wide uppercase">
              {language === 'ur' ? 'اہم سروسز' : 'Popular Services'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {services.map((service) => (
                <li key={service.id}>
                  <button
                    onClick={() => onNavigate('service-detail', service.slug)}
                    className="text-neutral-400 hover:text-[#FFC928] transition-colors text-start flex items-center justify-between w-full group"
                  >
                    <span>{language === 'ur' ? service.nameUr : service.nameEn}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Service Coverage Areas */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 tracking-wide uppercase">
              {language === 'ur' ? 'سروس کے علاقے' : 'Service Areas'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400">
              {areas.map((area) => (
                <span key={area.id} className="py-1">
                  • {language === 'ur' ? area.nameUr : `${area.area}, ${area.city}`}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-neutral-500">
              {language === 'ur'
                ? 'کراچی، لاہور اور اسلام آباد/راولپنڈی کے تمام بڑے علاقوں میں دستیاب۔'
                : 'Covering key sectors in Karachi, Lahore, and Islamabad / Rawalpindi.'}
            </p>
          </div>

          {/* Col 4: Verified Contact & Hours */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-white text-sm mb-4 tracking-wide uppercase">
              {language === 'ur' ? 'رابطہ و اوقات' : 'Contact & Hours'}
            </h4>

            <div className="flex items-start gap-2.5 text-neutral-400">
              <MapPin className="w-4 h-4 text-[#FFC928] shrink-0 mt-0.5" />
              <span>{language === 'ur' ? settings.addressUr : settings.addressEn}</span>
            </div>

            <div className="flex items-center gap-2.5 text-neutral-400">
              <Phone className="w-4 h-4 text-[#FFC928] shrink-0" />
              <a href={`tel:${settings.phone}`} className="hover:text-white font-mono-numbers" dir="ltr">
                {settings.phoneDisplay}
              </a>
            </div>

            <div className="flex items-center gap-2.5 text-neutral-400">
              <Mail className="w-4 h-4 text-[#FFC928] shrink-0" />
              <a href={`mailto:${settings.email}`} className="hover:text-white">
                {settings.email}
              </a>
            </div>

            <div className="flex items-start gap-2.5 text-neutral-400 pt-2 border-t border-[#2A313B]">
              <Clock className="w-4 h-4 text-[#FFC928] shrink-0 mt-0.5" />
              <span className="text-xs">
                {language === 'ur' ? settings.operatingHoursUr : settings.operatingHoursEn}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            © {new Date().getFullYear()} ABC Electrician Services. {language === 'ur' ? 'جملہ حقوق محفوظ ہیں۔' : 'All rights reserved.'}
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('privacy-policy')}
              className="hover:text-neutral-300 transition-colors"
            >
              {language === 'ur' ? 'رازداری کی پالیسی' : 'Privacy Policy'}
            </button>
            <button
              onClick={() => onNavigate('terms')}
              className="hover:text-neutral-300 transition-colors"
            >
              {language === 'ur' ? 'شرائط و ضوابط' : 'Terms of Service'}
            </button>
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="text-[#FFC928]/80 hover:text-[#FFC928] font-medium"
            >
              {t.nav.adminPortal}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
