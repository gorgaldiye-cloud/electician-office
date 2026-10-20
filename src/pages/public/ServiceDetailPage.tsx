import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { InspectionNotice } from '../../components/ui/InspectionNotice';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Phone,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ServiceDetailPageProps {
  slug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({ slug, onNavigate }) => {
  const { language, direction, t, formatMoney } = useLanguage();
  const service = repository.getServiceBySlug(slug);
  const settings = repository.getSettings();

  const BackIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;

  if (!service) {
    return (
      <div className="py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-[#15191F]">
          {language === 'ur' ? 'سروس نہیں ملی' : 'Service Not Found'}
        </h2>
        <p className="text-sm text-[#5B6572] mt-2 mb-6">
          {language === 'ur' ? 'براہ کرم سروسز کی فہرست میں سے انتخاب کریں۔' : 'Please browse our available services.'}
        </p>
        <button
          onClick={() => onNavigate('services')}
          className="px-6 py-2.5 rounded-lg font-bold bg-[#FFC928] text-[#15191F]"
        >
          {t.common.viewAll}
        </button>
      </div>
    );
  }

  return (
    <div className="py-10 lg:py-16 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <button
          onClick={() => onNavigate('services')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6572] hover:text-[#15191F] mb-6 transition-colors"
        >
          <BackIcon className="w-4 h-4" />
          <span>{language === 'ur' ? 'تمام سروسز پر واپس جائیں' : 'Back to All Services'}</span>
        </button>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10 border-b border-[#D5DBE1]">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
              {language === 'ur' ? 'مصدقہ الیکٹریکل حل' : 'Certified Electrical Service'}
            </span>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#15191F] leading-tight">
              {language === 'ur' ? service.nameUr : service.nameEn}
            </h1>

            <p className="text-base text-[#5B6572] leading-relaxed">
              {language === 'ur' ? service.descriptionUr : service.descriptionEn}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EEF1F4] text-xs font-semibold text-[#15191F]">
                <Clock className="w-4 h-4 text-[#5B6572]" />
                <span>{service.estimatedDurationMinutes} {t.common.minutes} {language === 'ur' ? 'اوسط وقت' : 'estimated'}</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E8E5A]/10 text-xs font-semibold text-[#1E8E5A]">
                <ShieldCheck className="w-4 h-4 text-[#1E8E5A]" />
                <span>30-Day Workmanship Warranty</span>
              </div>
            </div>
          </div>

          {/* Inspection Notice & CTA Card */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <InspectionNotice variant="detailed" />

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => onNavigate('book-service', service.id)}
                className="w-full py-3.5 px-6 rounded-xl text-sm font-bold bg-[#FFC928] hover:bg-[#E6B000] text-[#15191F] shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>{t.nav.bookService}</span>
              </button>

              <a
                href={`tel:${settings.phone}`}
                className="w-full py-3 px-6 rounded-xl text-sm font-semibold bg-[#15191F] hover:bg-[#2A313B] text-white transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-[#FFC928]" />
                <span dir="ltr">{language === 'ur' ? `کال کریں: ${settings.phoneDisplay}` : `Call Now: ${settings.phoneDisplay}`}</span>
              </a>
            </div>
          </div>
        </div>

        {/* What's Included & Process */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-12 border-b border-[#D5DBE1]">
          {/* What's Included */}
          <div>
            <h3 className="font-display font-bold text-lg text-[#15191F] mb-4">
              {language === 'ur' ? 'اس سروس میں کیا شامل ہے؟' : "What's Included in this Service"}
            </h3>
            <ul className="space-y-3">
              {(language === 'ur' ? service.includedUr : service.includedEn).map((inc, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#2A313B]">
                  <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0 mt-0.5" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Execution Process */}
          <div>
            <h3 className="font-display font-bold text-lg text-[#15191F] mb-4">
              {language === 'ur' ? 'کام کا مرحلہ وار طریقہ کار' : 'Standard Execution Protocol'}
            </h3>
            <ol className="space-y-3">
              {(language === 'ur' ? service.processUr : service.processEn).map((prc, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#2A313B]">
                  <span className="w-6 h-6 rounded-full bg-[#15191F] text-[#FFC928] text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{prc}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Safety & Compliance Note */}
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E8E5A]/10 text-[#1E8E5A] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#15191F]">
                {language === 'ur' ? '100 فیصد محفوظ الیکٹریکل کام' : 'Licensed Safety Standards'}
              </div>
              <div className="text-xs text-[#5B6572]">
                {language === 'ur'
                  ? 'ہمارے کاریگر سیفٹی شوز، انسولیٹڈ دستانے اور ٹیسٹرز کے ساتھ کام کرتے ہیں۔'
                  : 'Calibrated multimeters, insulated 1000V tools, and strict personal protective equipment.'}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('book-service', service.id)}
            className="w-full sm:w-auto px-6 py-3 rounded-lg text-xs font-bold bg-[#15191F] text-white hover:bg-[#2A313B] transition-colors"
          >
            {language === 'ur' ? 'اس سروس کے لیے وقت بُک کریں' : 'Schedule this Service'}
          </button>
        </div>
      </div>
    </div>
  );
};
