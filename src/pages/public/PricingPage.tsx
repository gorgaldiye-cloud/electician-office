import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { InspectionNotice } from '../../components/ui/InspectionNotice';
import {
  ShieldCheck,
  Search,
  FileCheck,
  Phone,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface PricingPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const { language, direction, t } = useLanguage();
  const settings = repository.getSettings();
  const services = repository.getServices();

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="py-12 lg:py-16 bg-neutral-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
            {language === 'ur' ? 'چارجز و معائنہ کی پالیسی' : 'Charges & Live Inspection Policy'}
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#15191F] mt-1">
            {language === 'ur' ? 'چارجز کا شفاف اور محفوظ طریقہ کار' : 'How Our Charges & Inspection Work'}
          </h1>
          <p className="text-sm sm:text-base text-[#5B6572] mt-3 leading-relaxed">
            {language === 'ur'
              ? 'بجلی کے کام میں بغیر دیکھے فون پر اندھا دھند رقم بتانا غیر پیشہ ورانہ اور غیر محفوظ ہے۔ ہم پہلے موقع پر آ کر تکنیکی معائنہ کرتے ہیں اور آپ کی منظوری کے بعد ہی کام شروع ہوتا ہے۔'
              : 'Estimating electrical work without visual and multimeter diagnosis creates safety risks and surprise bills. We operate on a strict live-inspection protocol where charges are agreed before work begins.'}
          </p>
        </div>

        {/* Primary Notice Banner */}
        <div className="mb-12">
          <InspectionNotice variant="detailed" />
        </div>

        {/* 3 Steps to Safe & Transparent Repair */}
        <div className="mb-14">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#15191F] mb-6 text-center">
            {language === 'ur' ? 'سروس حاصل کرنے کا 3 مرحلہ وار عمل' : '3-Step Inspection & Pricing Process'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-[#D5DBE1] shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#15191F] text-[#FFC928] flex items-center justify-center font-black text-sm">
                  01
                </div>
                <h3 className="font-bold text-base text-[#15191F]">
                  {language === 'ur' ? '1. سلاٹ بُک کریں یا کال کریں' : '1. Book a Slot or Call'}
                </h3>
                <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">
                  {language === 'ur'
                    ? 'آن لائن 3 منٹ میں اپنے مطلوبہ دن اور وقت کا سلاٹ منتخب کریں، یا ہماری ہاٹ لائن پر کال کریں۔'
                    : 'Choose your preferred date and verified time slot online, or call our certified dispatch team directly.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#EEF1F4] text-xs font-semibold text-[#15191F]">
                {language === 'ur' ? 'فوری تصدیق' : 'Instant Dispatch Response'}
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-[#D5DBE1] shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFC928] text-[#15191F] flex items-center justify-center font-black text-sm">
                  02
                </div>
                <h3 className="font-bold text-base text-[#15191F]">
                  {language === 'ur' ? '2. آن سائٹ لائیو معائنہ' : '2. On-Site Live Inspection'}
                </h3>
                <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">
                  {language === 'ur'
                    ? 'الیکٹریشن وقت پر پہنچ کر کیلیبریٹڈ ملٹی میٹر اور ٹولز سے تاروں، بریکرز اور ارتھنگ کا معائنہ کرتا ہے۔'
                    : 'A verified electrician arrives on schedule with calibrated testing tools to trace faults and measure load balance.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#EEF1F4] text-xs font-semibold text-[#1E8E5A] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'ur' ? 'محفوظ تشخیصی آلات' : 'Calibrated Diagnostic Gear'}</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-[#D5DBE1] shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E8E5A] text-white flex items-center justify-center font-black text-sm">
                  03
                </div>
                <h3 className="font-bold text-base text-[#15191F]">
                  {language === 'ur' ? '3. پیشگی منظوری اور رسید' : '3. Upfront Quote & Invoice'}
                </h3>
                <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">
                  {language === 'ur'
                    ? 'معائنے کے بعد اصل چارجز بتائے جاتے ہیں۔ آپ کی منظوری کے بعد کام ہوگا اور باضابطہ رسید دی جائے گی۔'
                    : 'Exact charges are quoted after inspection. Work proceeds only upon your approval, finalized with a formal invoice.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#EEF1F4] text-xs font-semibold text-[#15191F]">
                {language === 'ur' ? '30 دن کی وارنٹی' : '30-Day Workmanship Guarantee'}
              </div>
            </div>
          </div>
        </div>

        {/* Available Services Summary (With Inspection Badges) */}
        <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 sm:p-8 shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#EEF1F4] mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-[#15191F]">
                {language === 'ur' ? 'تمام سروسز پر لائیو انسپیکشن پالیسی' : 'Inspection-Based Service Directory'}
              </h3>
              <p className="text-xs text-[#5B6572] mt-0.5">
                {language === 'ur'
                  ? 'ہر سروس کی درست فیس سائٹ کے دورے اور تکنیکی معائنے کے بعد طے ہوتی ہے۔'
                  : 'All appointments undergo on-site evaluation before final itemized confirmation.'}
              </p>
            </div>

            <button
              onClick={() => onNavigate('services')}
              className="text-xs font-bold text-[#15191F] hover:text-[#B26A00] flex items-center gap-1 self-start sm:self-auto"
            >
              <span>{t.common.viewAll}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv) => (
              <div
                key={srv.id}
                onClick={() => onNavigate('service-detail', srv.slug)}
                className="p-4 rounded-xl border border-[#EEF1F4] hover:border-[#15191F] transition-all cursor-pointer flex flex-col justify-between gap-2 group bg-neutral-50/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-[#15191F] group-hover:text-[#B26A00] transition-colors">
                    {language === 'ur' ? srv.nameUr : srv.nameEn}
                  </h4>
                  <span className="text-[11px] text-[#5B6572] shrink-0 font-medium">
                    {srv.estimatedDurationMinutes} {t.common.minutes}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <InspectionNotice variant="badge" />
                  <span className="text-xs font-bold text-[#15191F] group-hover:underline">
                    {t.common.viewDetails} →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Callout */}
        <div className="bg-[#15191F] text-white p-8 rounded-2xl border border-[#2A313B] shadow-lg text-center flex flex-col items-center gap-5">
          <div className="max-w-xl space-y-2">
            <h3 className="font-display font-extrabold text-2xl text-white">
              {language === 'ur'
                ? 'اپنے برقی مسئلے کے لیے معائنہ شیڈول کریں'
                : 'Schedule a Diagnostic Inspection'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {language === 'ur'
                ? 'ہمارے مصدقہ الیکٹریشن وقت پر پہنچ کر آپ کو شفاف حل اور کوٹیشن فراہم کریں گے۔'
                : 'Book an appointment in minutes or speak directly with our engineering dispatch coordinator.'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => onNavigate('book-service')}
              className="px-8 py-3.5 rounded-xl text-sm font-bold bg-[#FFC928] text-[#15191F] hover:bg-[#E6B000] shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{t.nav.bookService}</span>
            </button>

            <a
              href={`tel:${settings.phone}`}
              className="px-7 py-3.5 rounded-xl text-sm font-semibold bg-[#2A313B] hover:bg-[#3D4754] text-white transition-all flex items-center gap-2 border border-[#3D4754]"
            >
              <Phone className="w-4 h-4 text-[#FFC928]" />
              <span dir="ltr">{language === 'ur' ? `کال کریں: ${settings.phoneDisplay}` : `Call Now: ${settings.phoneDisplay}`}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
