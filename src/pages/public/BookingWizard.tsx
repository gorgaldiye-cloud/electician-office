import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { Service, ServiceArea, UrgencyLevel, Booking } from '../../types';
import { InspectionNotice } from '../../components/ui/InspectionNotice';
import {
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Phone,
  Share2,
} from 'lucide-react';

interface BookingWizardProps {
  initialServiceId?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ initialServiceId, onNavigate }) => {
  const { language, direction, t, formatMoney } = useLanguage();
  const services = repository.getServices();
  const areas = repository.getServiceAreas();
  const settings = repository.getSettings();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialServiceId || services[0]?.id || ''
  );
  const [problemDescription, setProblemDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [selectedCity, setSelectedCity] = useState('Karachi');
  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('standard');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Completed submission state
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];
  const selectedArea = areas.find((a) => a.id === selectedAreaId) || areas[0];

  // Availability comes from Supabase so other customers' bookings are respected.
  const [availableSlots, setAvailableSlots] = useState<{ time: string; start: string; end: string; available: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoadingSlots(true);
    setAvailableSlots([]);
    void repository.getOnlineAvailableSlots(selectedDate, selectedServiceId)
      .then((slots) => {
        if (!active) return;
        setAvailableSlots(slots);
        setSelectedSlot((current) =>
          current && slots.some((slot) => slot.time === current && slot.available)
            ? current
            : (slots.find((slot) => slot.available)?.time || '')
        );
      })
      .catch((error) => {
        if (!active) return;
        setAvailableSlots([]);
        setSelectedSlot('');
        setErrorMessage(error instanceof Error ? error.message : 'Appointment times are temporarily unavailable.');
      })
      .finally(() => {
        if (active) setIsLoadingSlots(false);
      });
    return () => { active = false; };
  }, [selectedDate, selectedServiceId]);

  // Quick hazard check
  const hasHazardKeywords = /(spark|smoke|fire|burning|blast|dhuan|aag|jalne|shola|dhamaka)/i.test(
    problemDescription
  );

  // Handle Photo upload mock
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.slice(0, 5 - photos.length).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          if (uploadEvent.target?.result) {
            setPhotos((prev) => [...prev, uploadEvent.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Step Validation
  const canProceed = (): boolean => {
    setErrorMessage('');
    switch (currentStep) {
      case 1:
        return !!selectedServiceId;
      case 2:
        return problemDescription.trim().length >= 10;
      case 3:
        return true; // photos optional
      case 4:
        return customerName.trim().length >= 2 && customerPhone.replace(/\D/g, '').length >= 10;
      case 5:
        return addressLine.trim().length >= 5 && !!selectedAreaId;
      case 6:
        return !!selectedDate && !!selectedSlot;
      case 7:
        return true; // urgency defaults to standard
      case 8:
        return termsAccepted && privacyAccepted;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      if (currentStep === 2) {
        setErrorMessage(
          language === 'ur'
            ? 'برائے مہربانی مسئلہ کم از کم 10 حروف میں بیان کریں۔'
            : 'Please describe the problem in at least 10 characters.'
        );
      } else if (currentStep === 4) {
        setErrorMessage(
          language === 'ur'
            ? 'برائے مہربانی درست نام اور 10 تا 11 ہندسوں کا موبائل فون نمبر درج کریں۔'
            : 'Please enter a valid full name and Pakistani mobile number.'
        );
      } else if (currentStep === 5) {
        setErrorMessage(
          language === 'ur'
            ? 'برائے مہربانی اپنا مکمل پتہ درج کریں۔'
            : 'Please enter a valid street address.'
        );
      } else if (currentStep === 8) {
        setErrorMessage(
          language === 'ur'
            ? 'آگے بڑھنے کے لیے شرائط اور پرائیویسی پالیسی کو قبول کرنا لازمی ہے۔'
            : 'You must accept the service terms and privacy agreement to continue.'
        );
      }
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!termsAccepted || !privacyAccepted) {
      setErrorMessage(
        language === 'ur'
          ? 'برائے مہربانی شرائط اور پرائیویسی کی توثیق کریں۔'
          : 'Please accept both agreements.'
      );
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // Normalize a Pakistani mobile number before saving the customer record.
      let phoneE164 = customerPhone.replace(/\D/g, '');
      if (phoneE164.startsWith('03')) {
        phoneE164 = '92' + phoneE164.substring(1);
      } else if (phoneE164.startsWith('3') && phoneE164.length === 10) {
        phoneE164 = '92' + phoneE164;
      }
      phoneE164 = '+' + phoneE164;

      const chosenSlotObj = availableSlots.find((s) => s.time === selectedSlot);
      if (!chosenSlotObj || !chosenSlotObj.available) {
        throw new Error(
          language === 'ur'
            ? 'یہ وقت اب دستیاب نہیں۔ براہِ کرم دوسرا سلاٹ منتخب کریں۔'
            : 'That appointment slot is no longer available. Please choose another slot.'
        );
      }

      const newBooking = await repository.createOnlineBooking({
        serviceId: selectedService.id,
        serviceNameEn: selectedService.nameEn,
        serviceNameUr: selectedService.nameUr,
        customerName: customerName.trim(),
        customerPhone: phoneE164,
        customerEmail: customerEmail.trim() || undefined,
        problemDescription: problemDescription.trim(),
        addressLine: addressLine.trim(),
        city: selectedCity,
        areaName: selectedArea.area,
        postalCode: selectedArea.postalCode,
        scheduledStart: chosenSlotObj.start,
        scheduledEnd: chosenSlotObj.end,
        urgency,
        estimatedAmount: selectedService.basePrice || undefined,
        language,
        source: 'website',
        privacyAcceptedAt: new Date().toISOString(),
        termsAcceptedAt: new Date().toISOString(),
      }, photos);

      // The reference is shown only after Supabase confirms the insert succeeded.
      setSubmittedBooking(newBooking);
    } catch (error) {
      console.error('Website booking submission failed:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : (language === 'ur'
              ? 'بکنگ محفوظ نہیں ہو سکی۔ براہِ کرم دوبارہ کوشش کریں۔'
              : 'We could not save your booking. Please try again or call our service desk.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReference = () => {
    if (submittedBooking) {
      navigator.clipboard.writeText(submittedBooking.bookingReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  // If Submitted, show the Confirmation Screen
  if (submittedBooking) {
    return (
      <div className="py-14 bg-neutral-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-[#D5DBE1] p-8 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#1E8E5A]/10 text-[#1E8E5A] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="font-display font-extrabold text-2xl text-[#15191F]">
              {t.booking.successTitle}
            </h2>

            <p className="text-sm text-[#5B6572] mt-2 max-w-md">
              {t.booking.successMsg}
            </p>
            {submittedBooking.attachmentsUploadWarning && (
              <p role="status" className="mt-3 max-w-md rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                {language === 'ur'
                  ? 'بکنگ محفوظ ہو گئی ہے، لیکن ایک یا زیادہ تصاویر اپ لوڈ نہیں ہو سکیں۔ براہِ کرم فون پر تصاویر فراہم کریں۔'
                  : 'Your booking was saved, but one or more photos could not be uploaded. Please share those photos with our service desk.'}
              </p>
            )}

            {/* Reference Highlight Box */}
            <div className="my-6 p-4 rounded-xl bg-[#EEF1F4] border border-[#D5DBE1] w-full max-w-md flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-[#5B6572]">
                {t.booking.successRef}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-2xl text-[#15191F] tracking-wider">
                  {submittedBooking.bookingReference}
                </span>
                <button
                  onClick={copyReference}
                  className="p-2 rounded-lg bg-white border border-[#D5DBE1] hover:bg-neutral-100 transition-colors"
                  title="Copy reference"
                >
                  {copiedRef ? <Check className="w-4 h-4 text-[#1E8E5A]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Appointment Snapshot */}
            <div className="w-full text-start p-4 rounded-xl border border-[#EEF1F4] bg-neutral-50/50 space-y-2 text-sm text-[#2A313B] mb-6">
              <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                <span className="text-[#5B6572]">{t.booking.steps.service}:</span>
                <span className="font-bold">
                  {language === 'ur' ? submittedBooking.serviceNameUr : submittedBooking.serviceNameEn}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                <span className="text-[#5B6572]">{t.booking.steps.schedule}:</span>
                <span className="font-bold">{selectedDate} ({selectedSlot})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                <span className="text-[#5B6572]">{t.booking.steps.address}:</span>
                <span className="font-medium text-end">
                  {submittedBooking.addressLine}, {submittedBooking.areaName}, {submittedBooking.city}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#5B6572]">{t.common.status}:</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FFF4CC] text-[#B26A00]">
                  {t.statusLabels[submittedBooking.status]}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
              <button
                onClick={() => onNavigate('track-booking', submittedBooking.bookingReference)}
                className="w-full py-3 px-4 rounded-lg font-bold bg-[#15191F] text-white hover:bg-[#2A313B] transition-colors"
              >
                {t.booking.trackCta}
              </button>

              <button
                onClick={() => onNavigate('home')}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-[#EEF1F4] text-[#15191F] hover:bg-[#D5DBE1] transition-colors"
              >
                {t.booking.homeCta}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 lg:py-14 bg-neutral-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
            {language === 'ur' ? 'آن لائن بکنگ پورٹل' : 'Real-Time Dispatch Engine'}
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#15191F] mt-1">
            {t.booking.title}
          </h1>
          <p className="text-sm text-[#5B6572] mt-1">
            {t.booking.subtitle}
          </p>

          {/* Stepper Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5B6572] mb-2">
              <span>
                {t.booking.step} {currentStep} {t.booking.of} {totalSteps}:{' '}
                <strong className="text-[#15191F]">
                  {currentStep === 1 && t.booking.steps.service}
                  {currentStep === 2 && t.booking.steps.problem}
                  {currentStep === 3 && t.booking.steps.photos}
                  {currentStep === 4 && t.booking.steps.details}
                  {currentStep === 5 && t.booking.steps.address}
                  {currentStep === 6 && t.booking.steps.schedule}
                  {currentStep === 7 && t.booking.steps.urgency}
                  {currentStep === 8 && t.booking.steps.review}
                </strong>
              </span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#D5DBE1] overflow-hidden">
              <div
                className="h-full bg-[#FFC928] transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 sm:p-8 shadow-sm">
          {/* Error Message if any */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#C62828] text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SELECT SERVICE */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                {language === 'ur' ? '1. درکار الیکٹریکل سروس منتخب کریں' : '1. Choose Electrical Service'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`p-4 rounded-xl border text-start flex flex-col justify-between gap-3 transition-all ${
                      selectedServiceId === service.id
                        ? 'border-[#15191F] bg-[#FFF4CC]/30 ring-2 ring-[#FFC928]'
                        : 'border-[#D5DBE1] hover:border-[#15191F]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-[#15191F]">
                        {language === 'ur' ? service.nameUr : service.nameEn}
                      </div>
                      <div className="text-xs text-[#5B6572] mt-1 line-clamp-2">
                        {language === 'ur' ? service.shortDescriptionUr : service.shortDescriptionEn}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#EEF1F4] w-full">
                      <span className="font-semibold text-[#15191F]">
                        {language === 'ur' ? 'چارجز لائیو معائنے کے بعد' : 'Charges after live inspection'}
                      </span>
                      <span className="text-[#5B6572]">{service.estimatedDurationMinutes} {t.common.minutes}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: PROBLEM DESCRIPTION */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                {language === 'ur' ? '2. خرابی کی تفصیل بیان کریں' : '2. Describe the Issue'}
              </h3>

              {/* Hazard Alert if hazardous terms present */}
              {hasHazardKeywords && (
                <div className="p-4 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#C62828] text-xs sm:text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">
                      {language === 'ur' ? 'فوری حفاظتی الرٹ!' : 'Emergency Hazard Alert!'}
                    </strong>
                    {t.booking.safetyWarning}
                  </div>
                </div>
              )}

              {/* Common Issue Quick Tap Chips */}
              <div>
                <label className="text-xs font-semibold text-[#5B6572] block mb-2">
                  {t.booking.commonIssuesTitle}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    language === 'ur' ? 'اے سی آن ہونے پر بریکر ٹرپ' : 'Main breaker trips on AC start',
                    language === 'ur' ? 'سوئچ بورڈ سے جلنے کی بو' : 'Burnt smell from switchboard',
                    language === 'ur' ? 'نلکے یا فریج سے کرنٹ' : 'Tingling shock from water tap/fridge',
                    language === 'ur' ? 'سولر یو پی ایس چینج اوور مسئلہ' : 'Solar inverter changeover issue',
                    language === 'ur' ? 'بلب کی روشنی کم زیادہ ہونا' : 'Voltage fluctuation / flickering lights',
                  ].map((issue, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setProblemDescription((prev) =>
                          prev ? `${prev}. ${issue}` : issue
                        )
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#EEF1F4] text-[#15191F] hover:bg-[#D5DBE1] transition-colors"
                    >
                      + {issue}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#15191F] mb-1.5">
                  {language === 'ur' ? 'تفصیلی بیان (لازمی)' : 'Detailed Description (required)'}
                </label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  rows={4}
                  placeholder={t.booking.problemDescPlaceholder}
                  className="w-full p-3.5 rounded-xl border border-[#D5DBE1] focus:border-[#15191F] focus:ring-1 focus:ring-[#15191F] text-sm outline-none resize-none"
                />
                <span className="text-xs text-[#5B6572] mt-1 block">
                  {problemDescription.length} / 1000 {language === 'ur' ? 'حروف' : 'characters'}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: OPTIONAL PHOTOS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                {language === 'ur' ? '3. تصاویر منسلک کریں (اختیاری)' : '3. Attach Fault Photos (Optional)'}
              </h3>
              <p className="text-xs sm:text-sm text-[#5B6572]">
                {t.booking.photoNotice}
              </p>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-[#D5DBE1] rounded-xl p-6 text-center hover:border-[#15191F] transition-colors">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-[#EEF1F4] flex items-center justify-center text-[#15191F]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#15191F]">
                    {language === 'ur' ? 'تصویر منتخب کریں یا یہاں ڈراپ کریں' : 'Click to Upload or Drag Photos'}
                  </span>
                  <span className="text-xs text-[#5B6572]">
                    JPG, PNG, WebP (Max 5 photos, ≤ 5 MB each)
                  </span>
                </label>
              </div>

              {/* Thumbnails */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                  {photos.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#D5DBE1]">
                      <img src={src} alt="Uploaded preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 end-1 w-6 h-6 rounded-full bg-[#15191F]/80 text-white flex items-center justify-center hover:bg-[#C62828] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: CUSTOMER DETAILS */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                {language === 'ur' ? '4. رابطے کی معلومات' : '4. Contact Details'}
              </h3>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#15191F] mb-1">
                    {t.booking.nameLabel} <span className="text-[#C62828]">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Bilal Khan"
                    className="w-full p-3 rounded-lg border border-[#D5DBE1] focus:border-[#15191F] text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#15191F] mb-1">
                    {t.booking.phoneLabel} <span className="text-[#C62828]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0300 1234567"
                      className="w-full p-3 rounded-lg border border-[#D5DBE1] focus:border-[#15191F] text-sm outline-none font-mono"
                      dir="ltr"
                    />
                  </div>
                  <span className="text-[11px] text-[#5B6572] mt-1 block">
                    {language === 'ur' ? 'ہم اس نمبر پر بکنگ کی تصدیق اور ٹریکنگ لنک بھیجیں گے۔' : 'We will send slot verification and updates to this number.'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#15191F] mb-1">
                    {t.booking.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-3 rounded-lg border border-[#D5DBE1] focus:border-[#15191F] text-sm outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ADDRESS & AREA */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                {language === 'ur' ? '5. سروس کی جگہ اور پتہ' : '5. Service Address'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#15191F] mb-1">
                    {t.booking.cityLabel}
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[#D5DBE1] focus:border-[#15191F] text-sm outline-none bg-white"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad / Rawalpindi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#15191F] mb-1">
                    {t.booking.areaLabel} <span className="text-[#C62828]">*</span>
                  </label>
                  <select
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[#D5DBE1] focus:border-[#15191F] text-sm outline-none bg-white"
                  >
                    {areas
                      .filter((a) => a.city === selectedCity)
                      .map((area) => (
                        <option key={area.id} value={area.id}>
                          {language === 'ur' ? area.nameUr : area.area}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#15191F] mb-1">
                  {t.booking.addressLabel} <span className="text-[#C62828]">*</span>
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="House 42-B, Street 7, Block 4"
                  className="w-full p-3 rounded-lg border border-[#D5DBE1] focus:border-[#15191F] text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 6: SCHEDULE & REAL SLOTS */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                {language === 'ur' ? '6. تاریخ اور وقت کا انتخاب' : '6. Select Date & Slot'}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#15191F] mb-1.5">
                  {t.booking.dateLabel}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot('');
                  }}
                  className="p-3 rounded-lg border border-[#D5DBE1] text-sm outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#15191F] mb-2">
                  {t.booking.timeSlotLabel} (Asia/Karachi PKT)
                </label>

                {isLoadingSlots && (
                  <p className="mb-3 text-xs text-[#5B6572]">
                    {language === 'ur' ? 'دستیاب اوقات چیک ہو رہے ہیں…' : 'Checking live availability…'}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`p-3.5 rounded-xl border text-start flex items-center justify-between transition-all ${
                        !slot.available
                          ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed line-through'
                          : selectedSlot === slot.time
                          ? 'border-[#15191F] bg-[#FFF4CC] font-bold text-[#15191F] ring-2 ring-[#FFC928]'
                          : 'border-[#D5DBE1] hover:border-[#15191F] text-[#2A313B]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#5B6572]" />
                        <span className="text-xs sm:text-sm">{slot.time}</span>
                      </div>
                      <span className="text-[11px] font-semibold">
                        {slot.available ? (
                          <span className="text-[#1E8E5A]">{language === 'ur' ? 'دستیاب' : 'Available'}</span>
                        ) : (
                          <span className="text-neutral-400">{language === 'ur' ? 'بُک ہو چکا' : 'Booked'}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: URGENCY LEVEL */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                {language === 'ur' ? '7. کام کی فوری ضرورت' : '7. Select Urgency Level'}
              </h3>

              <div className="space-y-3">
                {[
                  {
                    level: 'standard' as UrgencyLevel,
                    title: t.urgencyLabels.standard,
                    desc: language === 'ur' ? 'مقررہ منتخب سلاٹ پر کاریگر پہنچے گا۔' : 'Technician arrives within the chosen slot window.',
                  },
                  {
                    level: 'urgent' as UrgencyLevel,
                    title: t.urgencyLabels.urgent,
                    desc: language === 'ur' ? 'اگلے 4 گھنٹوں میں ترجیحی ڈسپیچ۔' : 'Priority dispatch window within 4 hours.',
                  },
                  {
                    level: 'emergency' as UrgencyLevel,
                    title: t.urgencyLabels.emergency,
                    desc: language === 'ur' ? 'شارٹ سرکٹ یا چنگاریوں کی صورت میں فوری ترین رابطہ۔' : 'Immediate dispatch alert for active hazards.',
                  },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setUrgency(item.level)}
                    className={`w-full p-4 rounded-xl border text-start flex flex-col gap-1 transition-all ${
                      urgency === item.level
                        ? 'border-[#15191F] bg-[#FFF4CC]/30 ring-2 ring-[#FFC928]'
                        : 'border-[#D5DBE1] hover:border-[#15191F]'
                    }`}
                  >
                    <span className="font-bold text-sm text-[#15191F]">{item.title}</span>
                    <span className="text-xs text-[#5B6572]">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: REVIEW & CONSENT */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                {language === 'ur' ? '8. درخواست کا جائزہ اور تصدیق' : '8. Review & Confirm'}
              </h3>

              {/* Summary Card */}
              <div className="p-4 rounded-xl border border-[#D5DBE1] bg-neutral-50 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                  <span className="text-[#5B6572]">{t.booking.steps.service}:</span>
                  <span className="font-bold">
                    {language === 'ur' ? selectedService.nameUr : selectedService.nameEn}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                  <span className="text-[#5B6572]">{t.booking.steps.schedule}:</span>
                  <span className="font-bold">{selectedDate} · {selectedSlot}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                  <span className="text-[#5B6572]">{t.booking.steps.details}:</span>
                  <span className="font-bold">{customerName} ({customerPhone})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                  <span className="text-[#5B6572]">{t.booking.steps.address}:</span>
                  <span className="font-medium text-end">{addressLine}, {selectedArea.area}, {selectedCity}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#5B6572]">{language === 'ur' ? 'چارجز کا اصول' : 'Pricing Policy'}:</span>
                  <span className="font-bold text-[#15191F]">
                    {language === 'ur' ? 'لائیو معائنہ کے بعد' : 'Confirmed after live inspection'}
                  </span>
                </div>
              </div>

              {/* Price Disclaimer */}
              <InspectionNotice variant="banner" />

              {/* Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2.5 text-xs text-[#2A313B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#15191F] focus:ring-[#FFC928]"
                  />
                  <span>{t.booking.termsConsent}</span>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-[#2A313B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#15191F] focus:ring-[#FFC928]"
                  />
                  <span>{t.booking.privacyConsent}</span>
                </label>
              </div>
            </div>
          )}

          {/* Step Navigation Controls */}
          <div className="pt-6 mt-6 border-t border-[#EEF1F4] flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#15191F] hover:bg-[#EEF1F4] transition-colors flex items-center gap-2"
              >
                <BackIcon className="w-4 h-4" />
                <span>{t.common.back}</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#FFC928] hover:bg-[#E6B000] text-[#15191F] shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]"
              >
                <span>{t.common.next}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-7 py-3 rounded-lg text-sm font-extrabold bg-[#15191F] text-white hover:bg-[#2A313B] shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
              >
                {isSubmitting
                  ? (language === 'ur' ? 'بکنگ محفوظ ہو رہی ہے…' : 'Saving booking…')
                  : t.booking.submitButton}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
