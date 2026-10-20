import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const { language, t } = useLanguage();
  const faqs = repository.getFAQs();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat = activeCategory === 'all' || faq.category === activeCategory;
    const q = language === 'ur' ? faq.questionUr : faq.questionEn;
    const a = language === 'ur' ? faq.answerUr : faq.answerEn;
    const matchesSearch =
      q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="py-12 lg:py-16 bg-neutral-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
            {language === 'ur' ? 'معلوماتی رہنمائی' : 'Knowledge Base'}
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#15191F] mt-1">
            {language === 'ur' ? 'اکثر پوچھے گئے سوالات' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-sm text-[#5B6572] mt-2">
            {language === 'ur'
              ? 'الیکٹریکل سروسز، قیمتوں، سیفٹی اور بکنگ کے حوالے سے عمومی سوالات کے جوابات۔'
              : 'Clear answers on safety protocols, emergency arrival windows, itemized billing, and warranties.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="w-4 h-4 absolute start-3.5 top-3.5 text-[#5B6572]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.common.search}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-[#D5DBE1] bg-white text-xs outline-none focus:border-[#15191F]"
          />
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, i) => (
            <div
              key={faq.id}
              className="bg-white rounded-xl border border-[#D5DBE1] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-5 text-start font-bold text-sm sm:text-base text-[#15191F] flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
              >
                <span>{language === 'ur' ? faq.questionUr : faq.questionEn}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    openIndex === i ? 'rotate-180 text-[#B26A00]' : 'text-[#5B6572]'
                  }`}
                />
              </button>

              {openIndex === i && (
                <div className="px-5 pb-5 text-sm text-[#5B6572] leading-relaxed border-t border-[#EEF1F4] pt-3">
                  {language === 'ur' ? faq.answerUr : faq.answerEn}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
