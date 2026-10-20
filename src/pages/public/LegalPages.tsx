import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';

interface LegalPageProps {
  type: 'privacy' | 'terms';
}

export const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
  const { language } = useLanguage();
  const settings = repository.getSettings();

  return (
    <div className="py-12 lg:py-16 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="border-b border-[#D5DBE1] pb-6 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
            {language === 'ur' ? 'قانونی پالیسی' : 'Legal Compliance'}
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#15191F] mt-1">
            {type === 'privacy'
              ? language === 'ur' ? 'رازداری کی پالیسی (Privacy Policy)' : 'Privacy Policy'
              : language === 'ur' ? 'سروس کی شرائط و ضوابط (Terms of Service)' : 'Terms of Service'}
          </h1>
          <p className="text-xs text-[#5B6572] mt-1">
            Effective Date: October 2026 · ABC Electrician Services ({settings.city}, Pakistan)
          </p>
        </div>

        <div className="prose prose-neutral max-w-none text-sm text-[#2A313B] leading-relaxed space-y-6">
          {type === 'privacy' ? (
            <>
              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#15191F]">1. Information We Collect</h3>
                <p>
                  ABC Electrician Services collects customer names, phone numbers, service street addresses, and problem descriptions solely for dispatching certified technicians, generating formal invoices, and providing post-repair warranty support.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#15191F]">2. Use of Mobile & Location Data</h3>
                <p>
                  We normalize Pakistani phone numbers (E.164) for SMS/WhatsApp appointment confirmations and dispatch updates. We never sell or share customer contact records with third-party telemarketers.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#15191F]">3. Photo Uploads & Fault Diagnostics</h3>
                <p>
                  Any electrical fixture or switchboard photos uploaded during the online booking process are accessed strictly by our dispatch managers and assigned electricians for tool and parts preparation.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#15191F]">1. Slot Availability & Punctuality</h3>
                <p>
                  Appointments are confirmed for specified time slots. If unexpected site delays occur on previous high-voltage jobs, our coordinator will notify the customer at least 45 minutes in advance.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#15191F]">2. Pricing & Estimations</h3>
                <p>
                  All online pricing labels ("Starting at", "Inspection Required") represent minimum diagnostic labor estimations. Final total amounts are agreed on-site with the customer prior to physical installation of components.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#15191F]">3. 30-Day Workmanship Warranty</h3>
                <p>
                  All completed repairs carry a 30-day workmanship warranty. If a joint or breaker installed by ABC fails within 30 days under normal operating conditions, our electrician will re-inspect free of labor charge.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
