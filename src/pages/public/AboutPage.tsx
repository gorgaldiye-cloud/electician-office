import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { ShieldCheck, Award, Users, CheckCircle2, Phone } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (view: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const settings = repository.getSettings();
  const staff = repository.getStaff();

  return (
    <div className="py-12 lg:py-16 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
            {language === 'ur' ? 'ہمارا تعارف و مشن' : 'About ABC Electrician Services'}
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#15191F] mt-1">
            {language === 'ur' ? 'محفوظ پاکستان کے لیے معیاری برقی خدمات' : 'Engineering Safe Electrical Infrastructure in Pakistan'}
          </h1>
          <p className="text-sm sm:text-base text-[#5B6572] mt-3 leading-relaxed">
            {language === 'ur'
              ? 'ہم نے پاکستان میں روایتی اناڑی پن کے مقابلے میں مصدقہ، پڑھے لکھے اور تربیت یافتہ الیکٹریشنز کا باضابطہ نیٹ ورک قائم کیا ہے۔'
              : 'Founded to replace haphazard electrical guesswork with structured engineering safety standards, transparent billing, and strict on-time appointments.'}
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16 pb-14 border-b border-[#D5DBE1]">
          <div className="space-y-4 text-sm text-[#2A313B] leading-relaxed">
            <h3 className="font-display font-bold text-xl text-[#15191F]">
              {language === 'ur' ? 'ہمارا مشن اور بنیادی سوچ' : 'Our Commitment to Safety'}
            </h3>
            <p>
              {language === 'ur'
                ? 'پاکستان کے گھریلو اور کمرشل سیکٹر میں بجلی کی شارٹ سرکٹنگ اور غیر معیاری بریکرز آگ لگنے کی سب سے بڑی وجہ ہیں۔ اے بی سی سروسز اس بات کو یقینی بناتی ہے کہ ہر کنکشن کاپر کی معیاری تار اور صحیح ایمپیئر ریٹنگ کے ساتھ کیا جائے۔'
                : 'Across residential and commercial establishments in Pakistan, poor terminal terminations, undersized aluminum cables, and counterfeit circuit breakers remain the primary source of catastrophic electrical fires.'}
            </p>
            <p>
              {language === 'ur'
                ? 'ہمارے تمام کاریگر ڈیجیٹل ملٹی میٹرز، ارتھنگ ریزسٹنس اوہم میٹرز اور تھرمل ڈیٹیکٹرز کا استعمال کرتے ہیں تاکہ مسئلے کی جڑ تک بغیر دیواریں توڑے پہنچا جا سکے۔'
                : 'Our field teams utilize digital multimeters, insulation megohmmeters, and thermal scanners to pinpoint high-resistance loose terminals and concealed short circuits without disruptive structural damage.'}
            </p>
          </div>

          <div className="bg-neutral-50 rounded-2xl border border-[#D5DBE1] p-6 space-y-4">
            <h4 className="font-bold text-base text-[#15191F]">
              {language === 'ur' ? 'ہماری تکنیکی خصوصیات:' : 'Core Operational Invariants:'}
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-[#2A313B]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0 mt-0.5" />
                <span>
                  <strong>100% Copper Standards:</strong> Only pure electrolytic copper conductors used in rewiring.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0 mt-0.5" />
                <span>
                  <strong>Calibrated Diagnostics:</strong> Quantitative voltage and earth-resistance tests on every job.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0 mt-0.5" />
                <span>
                  <strong>Guaranteed Punctuality:</strong> Arriving within verified 60-minute booking windows.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0 mt-0.5" />
                <span>
                  <strong>Formal Itemized Invoices:</strong> No hidden costs; clear breakdown of parts & labor.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Staff Team Section */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="font-display font-bold text-2xl text-[#15191F]">
              {language === 'ur' ? 'ہماری بنیادی ٹیم' : 'Certified Engineering & Operations Team'}
            </h3>
            <p className="text-xs sm:text-sm text-[#5B6572] mt-1">
              {language === 'ur' ? 'ہر رکن اپنے شعبے کا تصدیق شدہ ماہر ہے۔' : 'Background-verified field electricians and slot dispatch managers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member) => (
              <div key={member.id} className="p-5 rounded-xl border border-[#D5DBE1] bg-white flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-[#15191F]">{member.fullName}</h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EEF1F4] text-[#15191F]">
                    {member.role === 'owner' && 'Owner'}
                    {member.role === 'booking_manager' && 'Dispatch'}
                    {member.role === 'technician' && 'Field Tech'}
                    {member.role === 'content_editor' && 'Safety Editor'}
                  </span>
                </div>
                <p className="text-xs text-[#5B6572]">
                  {language === 'ur' ? member.specializationUr : member.specializationEn}
                </p>
                <div className="pt-2 text-[11px] text-[#5B6572] border-t border-[#EEF1F4]">
                  Verified Phone: <span className="font-mono">{member.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Licenses & Standards Note (Per PRD placeholder policy) */}
        <div className="p-6 rounded-2xl bg-neutral-50 border border-[#D5DBE1] text-xs text-[#5B6572] space-y-2">
          <div className="font-bold text-[#15191F] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#B26A00]" />
            <span>Licensing, Credentials & Legal Compliance</span>
          </div>
          <p>
            All field personnel operate under supervisory licenses and technical certifications. Corporate registration, sales tax registration number (STRN), and municipal contractor licenses are on file at our registered address: <em>{settings.addressEn}</em>.
          </p>
        </div>
      </div>
    </div>
  );
};
