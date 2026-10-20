import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { BlogPost } from '../../types';
import { Clock, Calendar, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export const BlogPage: React.FC = () => {
  const { language, direction, t } = useLanguage();
  const posts = repository.getBlogPosts();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const BackIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;

  if (selectedPost) {
    return (
      <div className="py-12 lg:py-16 bg-white min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => setSelectedPost(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6572] hover:text-[#15191F] mb-6 transition-colors"
          >
            <BackIcon className="w-4 h-4" />
            <span>{language === 'ur' ? 'تمام مضامین پر واپس جائیں' : 'Back to All Guides'}</span>
          </button>

          <div className="space-y-4 mb-8">
            <span className="text-xs font-bold text-[#B26A00] uppercase tracking-wider">
              {selectedPost.category} · {selectedPost.readTime}
            </span>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#15191F] leading-tight">
              {language === 'ur' ? selectedPost.titleUr : selectedPost.titleEn}
            </h1>

            <div className="flex items-center gap-4 text-xs text-[#5B6572] pt-2 border-b border-[#EEF1F4] pb-4">
              <span>{selectedPost.publishedAt}</span>
              <span>·</span>
              <span>ABC Technical Safety Board</span>
            </div>
          </div>

          <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-200 mb-8">
            <img
              src={selectedPost.coverImage}
              alt={selectedPost.titleEn}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="prose prose-neutral max-w-none text-sm sm:text-base text-[#2A313B] leading-relaxed whitespace-pre-line">
            {language === 'ur' ? selectedPost.bodyUr : selectedPost.bodyEn}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 lg:py-16 bg-neutral-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
            {language === 'ur' ? 'تکنیکی معلومات' : 'Safety & Engineering Guides'}
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#15191F] mt-1">
            {language === 'ur' ? 'الیکٹریکل سیفٹی اور آگاہی گائیڈز' : 'Electrical Safety & Engineering Insights'}
          </h1>
          <p className="text-sm sm:text-base text-[#5B6572] mt-2">
            {language === 'ur'
              ? 'پاکستان کے موسمی اور وولٹیج مسائل سے نپٹنے کے لیے ہمارے انجینئرز کی مستند تحریریں۔'
              : 'Practical advice on earthing, surge protection, monsoon wiring precautions, and solar inverter integration in Pakistan.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-white rounded-2xl border border-[#D5DBE1] overflow-hidden flex flex-col hover:border-[#15191F] hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="aspect-[16/9] bg-neutral-200 overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#5B6572] mb-2">
                    <span className="font-bold text-[#B26A00]">{post.category}</span>
                    <span>·</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#15191F] group-hover:text-[#B26A00] transition-colors leading-snug">
                    {language === 'ur' ? post.titleUr : post.titleEn}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#5B6572] mt-2 line-clamp-3 leading-relaxed">
                    {language === 'ur' ? post.excerptUr : post.excerptEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EEF1F4] flex items-center justify-between text-xs font-semibold text-[#15191F]">
                  <span>{post.publishedAt}</span>
                  <span className="text-[#B26A00] group-hover:underline">
                    {language === 'ur' ? 'مکمل پڑھیں →' : 'Read Article →'}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
