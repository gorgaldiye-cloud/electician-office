import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { Star, CheckCircle2, MessageSquare, Plus } from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const reviews = repository.getReviews();

  const [showModal, setShowModal] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Karachi');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName || !comment) return;

    repository.addReview({
      authorName,
      area: area || 'DHA',
      city,
      rating,
      commentEn: comment,
      commentUr: comment,
    });

    setSubmitted(true);
    setTimeout(() => {
      setShowModal(false);
      setSubmitted(false);
      setAuthorName('');
      setComment('');
    }, 1500);
  };

  return (
    <div className="py-12 lg:py-16 bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
              {language === 'ur' ? 'گاہکوں کے تاثرات' : 'Verified Reviews'}
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#15191F] mt-1">
              {t.home.testimonialsTitle}
            </h1>
            <p className="text-sm text-[#5B6572] mt-1">
              {t.home.testimonialsSubtitle}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#15191F] text-white hover:bg-[#2A313B] transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#FFC928]" />
            <span>{language === 'ur' ? 'اپنی رائے دیں' : 'Leave a Review'}</span>
          </button>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 rounded-2xl border border-[#D5DBE1] shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
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
                  <span className="text-[#5B6572]">{rev.area}, {rev.city} · {rev.date}</span>
                </div>
                <span className="text-[#1E8E5A] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.common.verified}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Leave Review Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl">
              <h3 className="font-bold text-lg text-[#15191F] mb-1">
                {language === 'ur' ? 'الیکٹریکل سروس کا فیڈبیک' : 'Share Your Experience'}
              </h3>
              <p className="text-xs text-[#5B6572] mb-4">
                {language === 'ur' ? 'آپ کی رائے ہمارے کام کے معیار کو بہتر بناتی ہے۔' : 'Your review helps keep our workmanship standards high.'}
              </p>

              {submitted ? (
                <div className="py-8 text-center text-sm font-bold text-[#1E8E5A]">
                  {language === 'ur' ? 'آپ کا فیڈبیک درج ہو گیا ہے! شکریہ۔' : 'Thank you for your feedback!'}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[#15191F] block mb-1">
                      {t.booking.nameLabel} *
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Asad Qureshi"
                      className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#15191F] block mb-1">
                        {t.booking.areaLabel}
                      </label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="e.g. Gulshan / DHA"
                        className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#15191F] block mb-1">
                        {t.booking.cityLabel}
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs outline-none bg-white"
                      >
                        <option value="Karachi">Karachi</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Islamabad">Islamabad</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#15191F] block mb-1">
                      {language === 'ur' ? 'درجہ بندی (Rating)' : 'Rating'}
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating ? 'text-[#FFC928] fill-[#FFC928]' : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#15191F] block mb-1">
                      {language === 'ur' ? 'آپ کی تفصیلی رائے' : 'Comment'} *
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder={language === 'ur' ? 'الیکٹریشن کے کام اور رویے پر اپنی رائے لکھیں...' : 'Share what you liked about the service...'}
                      className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs outline-none resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg text-xs font-bold bg-[#15191F] text-white hover:bg-[#2A313B]"
                    >
                      {t.common.submit}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
