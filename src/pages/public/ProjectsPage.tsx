import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { MapPin, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

interface ProjectsPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const projects = repository.getProjects();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Commercial', 'Residential', 'Solar & Backup'];

  const filteredProjects = projects.filter((p) =>
    selectedCategory === 'all' ? true : p.category === selectedCategory
  );

  return (
    <div className="py-12 lg:py-16 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
            {language === 'ur' ? 'کامیاب کام' : 'Proven Workmanship'}
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#15191F] mt-1">
            {t.home.projectsTitle}
          </h1>
          <p className="text-sm sm:text-base text-[#5B6572] mt-2">
            {t.home.projectsSubtitle}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#15191F] text-white shadow-sm'
                  : 'bg-white text-[#5B6572] border border-[#D5DBE1] hover:text-[#15191F]'
              }`}
            >
              {cat === 'all' ? t.common.all : cat}
            </button>
          ))}
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-[#D5DBE1] overflow-hidden flex flex-col hover:border-[#15191F] hover:shadow-md transition-all group"
            >
              <div className="aspect-[16/10] bg-neutral-200 overflow-hidden relative">
                <img
                  src={proj.imagePath}
                  alt={proj.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-3 start-3 px-2.5 py-1 rounded bg-[#15191F]/80 backdrop-blur-sm text-white text-[11px] font-semibold">
                  {proj.category}
                </span>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5B6572] mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#B26A00]" />
                    <span>{proj.area}, {proj.city}</span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#15191F] leading-snug">
                    {language === 'ur' ? proj.titleUr : proj.titleEn}
                  </h3>

                  <p className="text-sm text-[#5B6572] mt-2 leading-relaxed">
                    {language === 'ur' ? proj.descriptionUr : proj.descriptionEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EEF1F4] flex items-center justify-between">
                  <span className="text-xs text-[#5B6572] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{proj.publishedAt}</span>
                  </span>

                  <button
                    onClick={() => onNavigate('book-service')}
                    className="text-xs font-bold text-[#15191F] hover:text-[#B26A00]"
                  >
                    {t.nav.bookService} →
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
