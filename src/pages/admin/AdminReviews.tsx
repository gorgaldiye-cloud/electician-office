import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { Review } from '../../types';
import { Star, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const { language, t } = useLanguage();
  const { currentStaff } = useAuth();

  const [reviews, setReviews] = useState<Review[]>(() => repository.getAdminReviews());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = () => {
    setReviews(repository.getAdminReviews());
  };

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    if (busyId) return;
    setBusyId(id);
    setErrorMessage(null);
    try {
      await repository.moderateOnlineReview(id, status, currentStaff.fullName);
      refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Review moderation failed. Please try again.');
    } finally {
      setBusyId(null);
    }
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

      {errorMessage && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

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
                  onClick={() => { void handleModerate(rev.id, 'approved'); }}
                  disabled={busyId === rev.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E8E5A] text-white hover:bg-[#167046] flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              )}

              {rev.moderationStatus !== 'rejected' && (
                <button
                  onClick={() => { void handleModerate(rev.id, 'rejected'); }}
                  disabled={busyId === rev.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FDE8E8] text-[#C62828] hover:bg-[#F8B4B4] flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
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
