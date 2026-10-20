import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { Review } from '../../types';
import { Star, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const { language, t } = useLanguage();
  const { currentStaff } = useAuth();

  const [reviews, setReviews] = useState<Review[]>(() => repository.getReviews(true));

  const refresh = () => {
    setReviews(repository.getReviews(true));
  };

  const handleModerate = (id: string, status: 'approved' | 'rejected') => {
    repository.moderateReview(id, status, currentStaff.fullName);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
          {language === 'ur' ? 'گاہکوں کے ریویوز اور ماڈریشن' : 'Customer Reviews & Moderation'}
        </h1>
        <p className="text-xs text-[#5B6572]">
          {language === 'ur'
            ? 'صارفین کی طرف سے جمع کروائے گئے ریویوز کی توثیق یا مسترد کرنے کا انتظام'
            : 'Moderate customer testimonials and ratings before public display.'}
        </p>
      </div>

      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white p-5 rounded-2xl border border-[#D5DBE1] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#15191F]">{rev.authorName}</span>
                <span className="text-xs text-[#5B6572]">({rev.area}, {rev.city})</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    rev.moderationStatus === 'approved'
                      ? 'bg-[#1E8E5A]/15 text-[#1E8E5A]'
                      : rev.moderationStatus === 'rejected'
                      ? 'bg-[#FDE8E8] text-[#C62828]'
                      : 'bg-[#FFF4CC] text-[#B26A00]'
                  }`}
                >
                  {rev.moderationStatus}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[#FFC928]">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#FFC928]" />
                ))}
                <span className="text-xs text-[#5B6572] ms-2">{rev.date}</span>
              </div>

              <p className="text-xs text-[#2A313B] italic">
                "{language === 'ur' ? rev.commentUr : rev.commentEn}"
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {rev.moderationStatus !== 'approved' && (
                <button
                  onClick={() => handleModerate(rev.id, 'approved')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E8E5A] text-white hover:bg-[#167046] flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              )}

              {rev.moderationStatus !== 'rejected' && (
                <button
                  onClick={() => handleModerate(rev.id, 'rejected')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FDE8E8] text-[#C62828] hover:bg-[#F8B4B4] flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
