import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, Info } from 'lucide-react';

interface InspectionNoticeProps {
  variant?: 'inline' | 'badge' | 'banner' | 'detailed';
  className?: string;
}

export const InspectionNotice: React.FC<InspectionNoticeProps> = ({
  variant = 'inline',
  className = '',
}) => {
  const { language } = useLanguage();

  const noticeEn = 'Charges will be confirmed after a live inspection.';
  const noticeUr = 'چارجز لائیو انسپیکشن کے بعد بتائے جائیں گے۔';
  const text = language === 'ur' ? noticeUr : noticeEn;

  if (variant === 'badge' || variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EEF1F4] text-[#15191F] border border-[#D5DBE1] ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-[#B26A00] shrink-0" />
        <span className="leading-snug">{text}</span>
      </span>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`p-4 rounded-xl bg-[#FFF4CC]/50 border border-[#FFC928]/50 flex items-start gap-3 text-xs sm:text-sm text-[#15191F] ${className}`}
      >
        <Info className="w-5 h-5 text-[#B26A00] shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-[#15191F] mb-0.5">
            {language === 'ur' ? 'شفاف و منصفانہ قیمتوں کا طریقہ کار' : 'Transparent On-Site Pricing Policy'}
          </div>
          <p className="text-[#2A313B] leading-relaxed">{text}</p>
        </div>
      </div>
    );
  }

  // Detailed breakdown
  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl bg-neutral-50 border border-[#D5DBE1] space-y-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[#B26A00] shrink-0" />
        <h4 className="font-bold text-sm sm:text-base text-[#15191F]">
          {language === 'ur'
            ? 'لائیو انسپیکشن کے بعد چارجز کی تصدیق'
            : 'Charges Confirmed After Live Inspection'}
        </h4>
      </div>

      <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">
        {language === 'ur'
          ? 'بجلی کے کام میں دیوار کے پیچھے کی تاروں اور لوڈ کی اصل حالت دیکھے بغیر من گھڑت قیمت بتانا غیر محفوظ ہے۔ ہمارے مصدقہ الیکٹریشن پہلے موقع پر آ کر محفوظ معائنہ کریں گے اور کام شروع کرنے سے پہلے حتمی رقم آپ کو بتائیں گے۔'
          : 'Electrical safety requires on-site testing of conductor health, load balance, and earthing. Our certified electricians conduct a thorough visual and multimeter diagnostic at your premises before confirming exact itemized charges.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
        <div className="bg-white p-2.5 rounded-lg border border-[#EEF1F4]">
          <span className="font-bold text-[#15191F] block mb-0.5">
            {language === 'ur' ? '1. وقت کا انتخاب' : '1. Schedule Slot'}
          </span>
          <span className="text-[#5B6572]">
            {language === 'ur' ? 'آن لائن آسان بکنگ' : 'Pick a confirmed time'}
          </span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-[#EEF1F4]">
          <span className="font-bold text-[#15191F] block mb-0.5">
            {language === 'ur' ? '2. لائیو معائنہ' : '2. On-Site Inspection'}
          </span>
          <span className="text-[#5B6572]">
            {language === 'ur' ? 'آلات کے ساتھ تفتیش' : 'Digital diagnosis'}
          </span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-[#EEF1F4]">
          <span className="font-bold text-[#15191F] block mb-0.5">
            {language === 'ur' ? '3. پیشگی منظوری' : '3. Upfront Quote'}
          </span>
          <span className="text-[#5B6572]">
            {language === 'ur' ? 'آپ کی منظوری پر کام' : 'Work starts upon approval'}
          </span>
        </div>
      </div>
    </div>
  );
};
