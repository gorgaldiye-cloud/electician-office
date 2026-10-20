import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { InspectionNotice } from '../../components/ui/InspectionNotice';
import {
  Shield,
  Clock,
  CheckCircle2,
  Phone,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  Zap,
  Building,
  Wrench,
  ChevronDown,
  Star,
  MapPin,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { language, direction, t, formatMoney } = useLanguage();
  const services = repository.getServices();
  const projects = repository.getProjects();
  const reviews = repository.getReviews();
  const faqs = repository.getFAQs().slice(0, 5);
  const areas = repository.getServiceAreas();
  const settings = repository.getSettings();

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative bg-[#15191F] text-white overflow-hidden py-14 lg:py-20">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFC928_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col (Text & CTAs) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Trust Kicker */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FFC928]">
                <Shield className="w-4 h-4 text-[#FFC928]" />
                <span>{language === 'ur' ? 'پاکستان بھر میں تصدیق شدہ الیکٹریکل سروسز' : 'Licensed Electrical Contractors · Pakistan'}</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white leading-[1.15]">
                {t.hero.headline}
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">
                {t.hero.subhead}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('book-service')}
                  className="px-7 py-3.5 rounded-lg text-base font-bold bg-[#FFC928] hover:bg-[#E6B000] text-[#15191F] shadow-lg shadow-[#FFC928]/20 transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  <span>{t.hero.primaryCta}</span>
                  <ArrowIcon className="w-4 h-4" />
                </button>

                <a
                  href={`tel:${settings.phone}`}
                  className="px-6 py-3.5 rounded-lg text-base font-semibold bg-[#2A313B] hover:bg-[#3D4754] text-white transition-all flex items-center gap-2 border border-[#3D4754]"
                >
                  <Phone className="w-4 h-4 text-[#FFC928]" />
                  <span dir="ltr">{settings.phoneDisplay}</span>
                </a>

                <button
                  onClick={() => onNavigate('ai-diagnostics')}
                  className="px-5 py-3.5 rounded-lg text-sm font-semibold bg-white/5 hover:bg-white/10 text-[#FFC928] border border-[#FFC928]/30 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#FFC928]" />
                  <span>{t.hero.diagnosticCta}</span>
                </button>
              </div>

              {/* Trust Metric Micro-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#2A313B]">
                <div>
                  <div className="text-xs text-neutral-400">{language === 'ur' ? 'حفاظتی معیار' : 'Safety Standard'}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{t.hero.stats.safetyFirst}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">{language === 'ur' ? 'کاریگر کی اہلیت' : 'Qualifications'}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{t.hero.stats.verifiedStaff}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">{language === 'ur' ? 'وقت کا سلاٹ' : 'Punctuality'}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{t.hero.stats.onTimeRate}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">{language === 'ur' ? 'سروس گارنٹی' : 'Workmanship'}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{t.hero.stats.warranty}</div>
                </div>
              </div>
            </div>

            {/* Right Col (Hero Photography with authentic badge) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#2A313B] aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3]">
                <img
                  src="/src/assets/images/hero_electrician_service_1792438169680.jpg"
                  alt="Certified Electrician inspecting panel board"
                  className="w-full h-full object-cover"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#15191F]/80 via-transparent to-transparent pointer-events-none" />

                {/* Floating badge inside image */}
                <div className="absolute bottom-4 inset-x-4 p-4 rounded-xl bg-[#15191F]/90 backdrop-blur-md border border-[#3D4754] text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FFC928] text-[#15191F] flex items-center justify-center font-bold">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">
                        {language === 'ur' ? 'کیمیکل ارتھنگ اور پینل اسپیشلسٹ' : 'Panel & Earthing Specialists'}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {language === 'ur' ? 'مصدقہ ڈیجیٹل آلات کے ساتھ' : 'Equipped with calibrated multimeters'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#FFC928] bg-[#2A313B] px-2.5 py-1 rounded">
                    230V / 400V
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EMERGENCY HAZARD BANNER */}
      <section className="bg-[#FFF4CC] border-y border-[#FFE082] py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-start">
            <div className="w-10 h-10 rounded-full bg-[#E6B000]/20 flex items-center justify-center text-[#B26A00] shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#15191F] text-sm sm:text-base">
                {t.home.emergencyBannerTitle}
              </h4>
              <p className="text-xs sm:text-sm text-[#5B6572] leading-tight">
                {t.home.emergencyBannerDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href={`tel:${settings.phone}`}
              className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#C62828] text-white hover:bg-[#B71C1C] transition-colors shadow-sm"
            >
              <span>{t.home.emergencyBannerCall}: </span>
              <span dir="ltr" className="font-mono-numbers">{settings.phoneDisplay}</span>
            </a>

            <button
              onClick={() => onNavigate('ai-diagnostics')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-white border border-[#D5DBE1] text-[#15191F] hover:bg-neutral-50 transition-colors"
            >
              {t.home.emergencyBannerAi}
            </button>
          </div>
        </div>
      </section>

      {/* 3. FEATURED SERVICES */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
                {language === 'ur' ? 'ماہرانہ خدمات' : 'Professional Catalog'}
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#15191F] mt-1">
                {t.home.servicesTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#5B6572] mt-2 max-w-2xl">
                {t.home.servicesSubtitle}
              </p>
            </div>

            <button
              onClick={() => onNavigate('services')}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#15191F] hover:text-[#B26A00] transition-colors self-start md:self-auto"
            >
              <span>{t.common.viewAll}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.slice(0, 6).map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl border border-[#D5DBE1] overflow-hidden flex flex-col hover:border-[#15191F] hover:shadow-lg transition-all group"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
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

                {/* Content */}
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
      </section>

      {/* 4. THREE-STEP PROCESS */}
      <section className="py-16 bg-[#EEF1F4] border-y border-[#D5DBE1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
              {language === 'ur' ? 'سادہ اور شفاف' : 'Streamlined Workflow'}
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#15191F] mt-1">
              {t.home.processTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#5B6572] mt-2">
              {t.home.processSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-[#D5DBE1] shadow-sm flex flex-col gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#FFC928] text-[#15191F] flex items-center justify-center font-black text-lg">
                01
              </div>
              <h3 className="font-display font-bold text-lg text-[#15191F]">
                {t.home.step1Title}
              </h3>
              <p className="text-sm text-[#5B6572] leading-relaxed">
                {t.home.step1Desc}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#D5DBE1] shadow-sm flex flex-col gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#15191F] text-[#FFC928] flex items-center justify-center font-black text-lg">
                02
              </div>
              <h3 className="font-display font-bold text-lg text-[#15191F]">
                {t.home.step2Title}
              </h3>
              <p className="text-sm text-[#5B6572] leading-relaxed">
                {t.home.step2Desc}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#D5DBE1] shadow-sm flex flex-col gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#FFC928] text-[#15191F] flex items-center justify-center font-black text-lg">
                03
              </div>
              <h3 className="font-display font-bold text-lg text-[#15191F]">
                {t.home.step3Title}
              </h3>
              <p className="text-sm text-[#5B6572] leading-relaxed">
                {t.home.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE ABC */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 flex flex-col gap-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
                {language === 'ur' ? 'ہمارا معیار' : 'Engineered for Reliability'}
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#15191F] leading-tight">
                {t.home.whyChooseTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#5B6572] leading-relaxed">
                {language === 'ur'
                  ? 'پاکستان میں بجلی کے غیر معیاری کام کی وجہ سے سالانہ ہزاروں حادثات پیش آتے ہیں۔ ہمارا مقصد ہر گھر اور کاروبار کو بین الاقوامی معیار کی محفوظ اور قابل بھروسہ سروس فراہم کرنا ہے۔'
                  : 'Substandard wiring and uncalibrated breakers cause thousands of fires annually. We deliver professional craftsmanship, authentic copper materials, and itemized billing.'}
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('about')}
                  className="px-6 py-3 rounded-lg text-sm font-bold bg-[#15191F] text-white hover:bg-[#2A313B] transition-colors"
                >
                  {t.nav.about}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-[#D5DBE1] bg-neutral-50 flex flex-col gap-2.5">
                <Shield className="w-6 h-6 text-[#1E8E5A]" />
                <h4 className="font-bold text-[#15191F] text-base">{t.home.why1Title}</h4>
                <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">{t.home.why1Desc}</p>
              </div>

              <div className="p-6 rounded-xl border border-[#D5DBE1] bg-neutral-50 flex flex-col gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-[#1E8E5A]" />
                <h4 className="font-bold text-[#15191F] text-base">{t.home.why2Title}</h4>
                <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">{t.home.why2Desc}</p>
              </div>

              <div className="p-6 rounded-xl border border-[#D5DBE1] bg-neutral-50 flex flex-col gap-2.5">
                <Wrench className="w-6 h-6 text-[#1E8E5A]" />
                <h4 className="font-bold text-[#15191F] text-base">{t.home.why3Title}</h4>
                <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">{t.home.why3Desc}</p>
              </div>

              <div className="p-6 rounded-xl border border-[#D5DBE1] bg-neutral-50 flex flex-col gap-2.5">
                <Building className="w-6 h-6 text-[#1E8E5A]" />
                <h4 className="font-bold text-[#15191F] text-base">{t.home.why4Title}</h4>
                <p className="text-xs sm:text-sm text-[#5B6572] leading-relaxed">{t.home.why4Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPLETED PROJECTS SHOWCASE */}
      <section className="py-16 bg-[#EEF1F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
                {language === 'ur' ? 'حالیہ کام' : 'Field Work Portfolio'}
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#15191F] mt-1">
                {t.home.projectsTitle}
              </h2>
              <p className="text-sm text-[#5B6572] mt-1">
                {t.home.projectsSubtitle}
              </p>
            </div>

            <button
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#15191F] hover:text-[#B26A00] transition-colors"
            >
              <span>{t.common.viewAll}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white rounded-xl border border-[#D5DBE1] overflow-hidden flex flex-col hover:border-[#15191F] transition-all"
              >
                <div className="aspect-[16/10] overflow-hidden bg-neutral-200">
                  <img
                    src={proj.imagePath}
                    alt={proj.titleEn}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#5B6572] mb-1">
                      <span>{proj.category}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#B26A00]" />
                        {proj.area}, {proj.city}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-base text-[#15191F]">
                      {language === 'ur' ? proj.titleUr : proj.titleEn}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#5B6572] mt-1.5 line-clamp-2">
                      {language === 'ur' ? proj.descriptionUr : proj.descriptionEn}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. VERIFIED CLIENT REVIEWS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
              {language === 'ur' ? 'حقیقی تاثرات' : 'Customer Satisfaction'}
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#15191F] mt-1">
              {t.home.testimonialsTitle}
            </h2>
            <p className="text-sm text-[#5B6572] mt-1">
              {t.home.testimonialsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-xl border border-[#D5DBE1] bg-white flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1 text-[#FFC928]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#FFC928]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#2A313B] italic leading-relaxed">
                    "{language === 'ur' ? rev.commentUr : rev.commentEn}"
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EEF1F4] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#15191F] block">{rev.authorName}</span>
                    <span className="text-[#5B6572]">{rev.area}, {rev.city}</span>
                  </div>
                  <span className="text-[#1E8E5A] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.common.verified}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TOP FAQS ACCORDION */}
      <section className="py-16 bg-neutral-50 border-t border-[#D5DBE1]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#15191F]">
              {language === 'ur' ? 'اکثر پوچھے گئے سوالات' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="rounded-xl border border-[#D5DBE1] bg-white overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-start font-bold text-sm sm:text-base text-[#15191F] flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
                >
                  <span>{language === 'ur' ? faq.questionUr : faq.questionEn}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-[#B26A00]' : 'text-[#5B6572]'
                    }`}
                  />
                </button>

                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-[#5B6572] leading-relaxed border-t border-[#EEF1F4] pt-3">
                    {language === 'ur' ? faq.answerUr : faq.answerEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. SERVICE AREAS LIST */}
      <section className="py-14 bg-white border-t border-[#D5DBE1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#15191F] mb-2">
            {t.home.areasTitle}
          </h2>
          <p className="text-sm text-[#5B6572] mb-8 max-w-xl mx-auto">
            {t.home.areasSubtitle}
          </p>

          <div className="flex flex-wrap justify-center gap-2.5 max-w-4xl mx-auto">
            {areas.map((area) => (
              <span
                key={area.id}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#EEF1F4] text-[#15191F] border border-[#D5DBE1]"
              >
                {language === 'ur' ? area.nameUr : `${area.area} (${area.city})`}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CALL TO ACTION BAND */}
      <section className="py-14 bg-[#FFC928] text-[#15191F]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-5">
          <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-[#15191F] tracking-tight">
            {language === 'ur'
              ? 'کیا آپ کو مستند الیکٹریشن کی ضرورت ہے؟'
              : 'Need a Certified Electrician Today?'}
          </h2>

          <p className="text-sm sm:text-base text-[#15191F]/90 max-w-2xl font-medium leading-relaxed">
            {language === 'ur'
              ? 'صرف 3 منٹ میں آن لائن سلاٹ بُک کریں یا فوری رہنمائی کے لیے ہمارے ڈسپیچ مینیجر کو کال کریں۔'
              : 'Book your appointment online in under 3 minutes with real slot availability, or call our emergency hotline directly.'}
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('book-service')}
              className="px-8 py-3.5 rounded-lg text-base font-bold bg-[#15191F] text-white hover:bg-[#2A313B] shadow-md transition-all active:scale-[0.98]"
            >
              {t.nav.bookService}
            </button>

            <a
              href={`tel:${settings.phone}`}
              className="px-7 py-3.5 rounded-lg text-base font-bold bg-white text-[#15191F] hover:bg-neutral-100 shadow-sm transition-all"
            >
              {t.nav.callNow}: <span dir="ltr">{settings.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
