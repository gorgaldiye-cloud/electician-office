import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { InspectionNotice } from '../../components/ui/InspectionNotice';
import { Clock, Shield, Search, ArrowRight, ArrowLeft } from 'lucide-react';

interface ServicesPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  const { language, direction, t, formatMoney } = useLanguage();
  const services = repository.getServices();
  const categories = repository.getCategories();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const filteredServices = services.filter((service) => {
    const matchesCategory = activeCategory === 'all' || service.categoryId === activeCategory;
    const name = language === 'ur' ? service.nameUr : service.nameEn;
    const desc = language === 'ur' ? service.shortDescriptionUr : service.shortDescriptionEn;
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-12 lg:py-16 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
            {language === 'ur' ? 'جامع سروس ڈائریکٹری' : 'Electrical Catalog'}
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#15191F] mt-1">
            {t.home.servicesTitle}
          </h1>
          <p className="text-sm sm:text-base text-[#5B6572] mt-2">
            {t.home.servicesSubtitle}
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EEF1F4] rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === 'all'
                  ? 'bg-white text-[#15191F] shadow-sm'
                  : 'text-[#5B6572] hover:text-[#15191F]'
              }`}
            >
              {t.common.all}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-white text-[#15191F] shadow-sm'
                    : 'text-[#5B6572] hover:text-[#15191F]'
                }`}
              >
                {language === 'ur' ? cat.nameUr : cat.nameEn}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute start-3 top-3 text-[#5B6572]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.common.search}
              className="w-full ps-9 pe-4 py-2 rounded-xl border border-[#D5DBE1] bg-white text-xs outline-none focus:border-[#15191F]"
            />
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-[#D5DBE1] overflow-hidden flex flex-col hover:border-[#15191F] hover:shadow-lg transition-all group"
            >
              <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                <img
                  src={service.imagePath}
                  alt={service.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 start-3">
                  <InspectionNotice variant="badge" />
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#5B6572] mb-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{service.estimatedDurationMinutes} {t.common.minutes}</span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#15191F] group-hover:text-[#B26A00] transition-colors leading-snug">
                    {language === 'ur' ? service.nameUr : service.nameEn}
                  </h3>

                  <p className="text-sm text-[#5B6572] mt-2 line-clamp-2 leading-relaxed">
                    {language === 'ur' ? service.shortDescriptionUr : service.shortDescriptionEn}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#EEF1F4] flex items-center justify-between gap-3">
                  <button
                    onClick={() => onNavigate('service-detail', service.slug)}
                    className="text-xs font-semibold text-[#5B6572] hover:text-[#15191F] transition-colors"
                  >
                    {t.common.viewDetails}
                  </button>

                  <button
                    onClick={() => onNavigate('book-service', service.id)}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[#FFC928] hover:bg-[#E6B000] text-[#15191F] transition-all"
                  >
                    {t.nav.bookService}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
