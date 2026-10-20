import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Send,
} from 'lucide-react';

interface ContactPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const settings = repository.getSettings();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !message) {
      setErrorMessage(
        language === 'ur'
          ? 'برائے مہربانی نام، فون نمبر اور پیغام لازمی درج کریں۔'
          : 'Please provide full name, phone number, and inquiry message.'
      );
      return;
    }

    setErrorMessage('');
    repository.createInquiry({
      fullName,
      phone,
      email: email || undefined,
      subject: subject || 'General Inquiry',
      message,
    });

    setIsSubmitted(true);
  };

  return (
    <div className="py-12 lg:py-16 bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
            {language === 'ur' ? 'براہ راست رابطہ' : 'Customer Support & Dispatch'}
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#15191F] mt-1">
            {language === 'ur' ? 'ہم سے رابطہ کریں' : 'Get in Touch with ABC Services'}
          </h1>
          <p className="text-sm sm:text-base text-[#5B6572] mt-2">
            {language === 'ur'
              ? 'ہمارا کوآرڈینیشن آفس اور کسٹمر ڈسپیچ سینٹر پیر تا ہفتہ آپ کی خدمت میں حاضر ہے۔'
              : 'Our operations center is ready to coordinate routine maintenance or emergency electrical response.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Direct Contact Info & WhatsApp */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-lg text-[#15191F] pb-3 border-b border-[#EEF1F4]">
                {language === 'ur' ? 'رابطے کی تفصیلات' : 'Direct Contact Channels'}
              </h3>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#FFC928]/20 text-[#B26A00] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-[#5B6572] block font-medium">
                    {language === 'ur' ? 'ہنگامی ہیلپ لائن' : 'Emergency Hotline'}
                  </span>
                  <a href={`tel:${settings.phone}`} className="text-base font-bold text-[#15191F] hover:text-[#B26A00] font-mono-numbers" dir="ltr">
                    {settings.phoneDisplay}
                  </a>
                </div>
              </div>

              {Boolean(settings.whatsapp) && (
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#1E8E5A]/15 text-[#1E8E5A] flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-[#5B6572] block font-medium">
                      WhatsApp Chat
                    </span>
                    <a
                      href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        language === 'ur' ? 'السلام علیکم! مجھے الیکٹریشن سروس کی ضرورت ہے۔' : 'Hello! I need an electrician service.'
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base font-bold text-[#1E8E5A] hover:underline font-mono-numbers"
                      dir="ltr"
                    >
                      {settings.phoneDisplay}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#EEF1F4] text-[#15191F] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-[#5B6572] block font-medium">
                    {language === 'ur' ? 'ای میل ایڈریس' : 'Email Address'}
                  </span>
                  <a href={`mailto:${settings.email}`} className="text-sm font-semibold text-[#15191F] hover:underline">
                    {settings.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-[#EEF1F4]">
                <div className="w-10 h-10 rounded-lg bg-[#EEF1F4] text-[#15191F] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-[#5B6572] block font-medium">
                    {language === 'ur' ? 'دفتر کا پتہ' : 'Headquarters'}
                  </span>
                  <span className="text-xs text-[#2A313B] leading-relaxed">
                    {language === 'ur' ? settings.addressUr : settings.addressEn}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-[#EEF1F4]">
                <div className="w-10 h-10 rounded-lg bg-[#EEF1F4] text-[#15191F] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-[#5B6572] block font-medium">
                    {language === 'ur' ? 'دفتری اوقات' : 'Operating Hours'}
                  </span>
                  <span className="text-xs text-[#2A313B]">
                    {language === 'ur' ? settings.operatingHoursUr : settings.operatingHoursEn}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Online Booking Callout */}
            <div className="bg-[#15191F] text-white p-6 rounded-2xl flex flex-col gap-3">
              <h4 className="font-bold text-base text-[#FFC928]">
                {language === 'ur' ? 'فوری وقت بُک کرنا چاہتے ہیں؟' : 'Prefer an instant booked slot?'}
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {language === 'ur'
                  ? 'ہمارے بکنگ وزرڈ کے ذریعے براہ راست دستیاب وقت منتخب کریں اور 3 منٹ میں کاریگر بُک کریں۔'
                  : 'Skip waiting for call responses by choosing a verified time slot through our online portal.'}
              </p>
              <button
                onClick={() => onNavigate('book-service')}
                className="mt-1 py-2.5 px-4 rounded-lg font-bold bg-[#FFC928] text-[#15191F] hover:bg-[#E6B000] text-xs transition-colors self-start"
              >
                {t.nav.bookService}
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Inquiry Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D5DBE1] p-6 sm:p-8 shadow-sm">
            <h3 className="font-bold text-xl text-[#15191F] mb-1">
              {language === 'ur' ? 'ہمیں پیغام بھیجیں' : 'Send an Inquiry or Quote Request'}
            </h3>
            <p className="text-xs text-[#5B6572] mb-6">
              {language === 'ur'
                ? 'فارم پُر کریں، ہمارا ڈسپیچ مینیجر جلد از جلد آپ سے رابطہ کرے گا۔'
                : 'Fill out this form and our booking manager will respond with guidance or scheduling.'}
            </p>

            {isSubmitted ? (
              <div className="py-12 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#1E8E5A]/15 text-[#1E8E5A] flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-lg text-[#15191F]">
                  {language === 'ur' ? 'آپ کا پیغام موصول ہو گیا ہے!' : 'Inquiry Successfully Submitted!'}
                </h4>
                <p className="text-xs text-[#5B6572] max-w-sm">
                  {language === 'ur'
                    ? 'شکریہ! ہماری ٹیم آپ کی فراہم کردہ معلومات کا جائزہ لے کر جلد رابطہ کرے گی۔'
                    : 'Thank you for reaching out. We have logged your inquiry and will follow up promptly.'}
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 px-5 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
                >
                  {language === 'ur' ? 'ایک اور پیغام بھیجیں' : 'Send Another Inquiry'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3.5 rounded-lg bg-[#FDE8E8] text-[#C62828] text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#15191F] mb-1">
                      {t.booking.nameLabel} <span className="text-[#C62828]">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                      className="w-full p-3 rounded-lg border border-[#D5DBE1] text-xs outline-none focus:border-[#15191F]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#15191F] mb-1">
                      {t.booking.phoneLabel} <span className="text-[#C62828]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03XX XXXXXXX"
                      className="w-full p-3 rounded-lg border border-[#D5DBE1] text-xs outline-none focus:border-[#15191F] font-mono"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#15191F] mb-1">
                      {t.booking.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full p-3 rounded-lg border border-[#D5DBE1] text-xs outline-none focus:border-[#15191F]"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#15191F] mb-1">
                      {language === 'ur' ? 'عنوان / موضوع' : 'Subject'}
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Solar inverter bypass query"
                      className="w-full p-3 rounded-lg border border-[#D5DBE1] text-xs outline-none focus:border-[#15191F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#15191F] mb-1">
                    {language === 'ur' ? 'تفصیلی پیغام' : 'Message'} <span className="text-[#C62828]">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder={
                      language === 'ur'
                        ? 'اپنے برقی مسئلے، نئے کام یا کوٹیشن کی تفصیلات یہاں لکھیں...'
                        : 'Please describe your inquiry, commercial requirements, or technical electrical query...'
                    }
                    className="w-full p-3 rounded-lg border border-[#D5DBE1] text-xs outline-none focus:border-[#15191F] resize-none leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg text-xs font-bold bg-[#15191F] text-white hover:bg-[#2A313B] transition-colors flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.common.submit}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
