import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { Booking, BookingStatus } from '../../types';
import { InspectionNotice } from '../../components/ui/InspectionNotice';
import {
  Search,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  RotateCcw,
  XCircle,
} from 'lucide-react';

interface TrackBookingPageProps {
  initialReference?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const TrackBookingPage: React.FC<TrackBookingPageProps> = ({ initialReference, onNavigate }) => {
  const { language, t, formatMoney, formatDate } = useLanguage();

  const [referenceInput, setReferenceInput] = useState(initialReference || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [availableRescheduleSlots, setAvailableRescheduleSlots] = useState<{ time: string; start: string; end: string; available: boolean }[]>([]);
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);

  // Cancel / Reschedule Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [newSlot, setNewSlot] = useState('');

  const lookupBooking = async (refToLookup: string, phoneToLookup: string) => {
    setErrorMsg('');
    setHasSearched(true);
    const clean = refToLookup.trim().toUpperCase();
    if (!clean || !phoneToLookup.trim()) {
      setErrorMsg(
        language === 'ur'
          ? 'برائے مہربانی بکنگ ریفرنس اور وہی موبائل نمبر درج کریں جو بکنگ کے وقت دیا تھا۔'
          : 'Please enter both the booking reference and the mobile number used when booking.'
      );
      setCurrentBooking(null);
      return;
    }

    setIsSearching(true);
    try {
      const found = await repository.trackOnlineBooking(clean, phoneToLookup);
      if (found) {
        setCurrentBooking(found);
      } else {
        setCurrentBooking(null);
        setErrorMsg(t.tracking.notFound);
      }
    } catch (error) {
      setCurrentBooking(null);
      setErrorMsg(
        error instanceof Error
          ? error.message
          : (language === 'ur' ? 'بکنگ کی تصدیق نہیں ہو سکی۔ دوبارہ کوشش کریں۔' : 'We could not verify those details. Please try again.')
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Prefill references from confirmation but never reveal private booking data without phone verification.
  useEffect(() => {
    if (initialReference) {
      setReferenceInput(initialReference);
      setCurrentBooking(null);
      setHasSearched(false);
    }
  }, [initialReference]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void lookupBooking(referenceInput, phoneInput);
  };

  const handleCancelSubmit = async () => {
    if (!currentBooking || !phoneInput.trim()) return;
    setIsActionLoading(true);
    setErrorMsg('');
    try {
      const updated = await repository.cancelOnlineBooking(
        currentBooking.bookingReference,
        phoneInput,
        cancelReason || 'Customer requested cancellation'
      );
      setCurrentBooking(updated);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'This booking could not be cancelled online.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!currentBooking || !phoneInput.trim() || !newSlot) return;
    const chosen = availableRescheduleSlots.find((slot) => slot.time === newSlot && slot.available);
    if (!chosen) {
      setErrorMsg(language === 'ur' ? 'یہ وقت اب دستیاب نہیں۔ دوسرا وقت منتخب کریں۔' : 'That appointment slot is no longer available.');
      return;
    }

    setIsActionLoading(true);
    setErrorMsg('');
    try {
      const updated = await repository.rescheduleOnlineBooking(
        currentBooking.bookingReference,
        phoneInput,
        chosen.start,
        chosen.end
      );
      setCurrentBooking(updated);
      setShowRescheduleModal(false);
      setNewSlot('');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'This booking could not be rescheduled online.');
    } finally {
      setIsActionLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!showRescheduleModal || !currentBooking) {
      setAvailableRescheduleSlots([]);
      return;
    }
    setIsLoadingRescheduleSlots(true);
    setAvailableRescheduleSlots([]);
    void repository.getOnlineAvailableSlots(newDate, currentBooking.serviceId)
      .then((slots) => {
        if (active) setAvailableRescheduleSlots(slots);
      })
      .catch((error) => {
        if (active) setErrorMsg(error instanceof Error ? error.message : 'Appointment times are temporarily unavailable.');
      })
      .finally(() => {
        if (active) setIsLoadingRescheduleSlots(false);
      });
    return () => { active = false; };
  }, [showRescheduleModal, newDate, currentBooking?.serviceId]);

  const statusSteps: { key: BookingStatus; label: string }[] = [
    { key: 'pending', label: t.statusLabels.pending },
    { key: 'confirmed', label: t.statusLabels.confirmed },
    { key: 'in_progress', label: t.statusLabels.in_progress },
    { key: 'completed', label: t.statusLabels.completed },
  ];

  const getStatusStepIndex = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'in_progress':
        return 2;
      case 'completed':
        return 3;
      default:
        return -1;
    }
  };

  return (
    <div className="py-12 lg:py-16 bg-neutral-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B26A00]">
            {language === 'ur' ? 'آن لائن ریکارڈ کی تفتیش' : 'Real-Time Status & Tracking'}
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#15191F] mt-1">
            {t.tracking.title}
          </h1>
          <p className="text-sm text-[#5B6572] mt-1">
            {t.tracking.subtitle}
          </p>
        </div>

        {/* Search Bar Card */}
        <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 shadow-sm mb-8">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute start-3.5 top-3.5 text-[#5B6572]" />
              <input
                type="text"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                placeholder={t.tracking.refPlaceholder}
                className="w-full ps-11 pe-4 py-3 rounded-xl border border-[#D5DBE1] focus:border-[#15191F] outline-none text-sm font-mono tracking-wider"
                dir="ltr"
                autoComplete="off"
                required
              />
            </div>
            <div className="flex-1 relative">
              <Phone className="w-4 h-4 absolute start-3.5 top-3.5 text-[#5B6572]" />
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder={language === 'ur' ? 'بکنگ والا موبائل نمبر' : 'Mobile number used for booking'}
                className="w-full ps-10 pe-4 py-3 rounded-xl border border-[#D5DBE1] focus:border-[#15191F] outline-none text-sm"
                autoComplete="tel"
                dir="ltr"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-7 py-3 rounded-xl text-sm font-bold bg-[#15191F] text-[#FFC928] hover:bg-[#2A313B] transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-wait"
            >
              {isSearching ? (language === 'ur' ? 'تصدیق ہو رہی ہے…' : 'Verifying…') : t.tracking.trackButton}
            </button>
          </form>

          {/* Sample quick buttons for user convenience */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#5B6572]">
            <span>{language === 'ur' ? 'ڈیمو ریفرنس ٹیسٹ کریں:' : 'Try sample reference:'}</span>
            {['ABC-261019-9X7M2P', 'ABC-261019-3T8K9Q', 'ABC-261019-7Y2M1Z', 'ABC-261018-4W6P8D'].map((ref) => (
              <button
                key={ref}
                type="button"
                onClick={() => {
                  setReferenceInput(ref);
                  lookupBooking(ref);
                }}
                className="px-2 py-0.5 rounded bg-[#EEF1F4] hover:bg-[#D5DBE1] font-mono text-[#15191F]"
              >
                {ref}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="mt-4 p-3.5 rounded-xl bg-[#FDE8E8] text-[#C62828] text-xs sm:text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Found Booking Details */}
        {currentBooking && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Status Timeline Card */}
            <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#EEF1F4]">
                <div>
                  <span className="text-xs text-[#5B6572] uppercase font-semibold">
                    {t.common.reference}
                  </span>
                  <h3 className="font-mono font-black text-xl text-[#15191F]">
                    {currentBooking.bookingReference}
                  </h3>
                </div>

                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      currentBooking.status === 'completed'
                        ? 'bg-[#1E8E5A]/15 text-[#1E8E5A]'
                        : currentBooking.status === 'in_progress'
                        ? 'bg-[#FFC928] text-[#15191F]'
                        : currentBooking.status === 'cancelled' || currentBooking.status === 'rejected'
                        ? 'bg-[#FDE8E8] text-[#C62828]'
                        : 'bg-[#FFF4CC] text-[#B26A00]'
                    }`}
                  >
                    {t.statusLabels[currentBooking.status]}
                  </span>
                </div>
              </div>

              {/* Progress Steps (if not cancelled/rejected) */}
              {currentBooking.status !== 'cancelled' && currentBooking.status !== 'rejected' && (
                <div className="pt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {statusSteps.map((step, idx) => {
                      const activeIndex = getStatusStepIndex(currentBooking.status);
                      const isComplete = idx <= activeIndex;
                      const isCurrent = idx === activeIndex;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-colors ${
                              isComplete
                                ? 'bg-[#15191F] text-[#FFC928]'
                                : 'bg-[#EEF1F4] text-[#5B6572]'
                            } ${isCurrent ? 'ring-4 ring-[#FFC928]/40' : ''}`}
                          >
                            {isComplete ? <CheckCircle2 className="w-5 h-5 text-[#FFC928]" /> : idx + 1}
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              isComplete ? 'text-[#15191F]' : 'text-[#5B6572]'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Two-Column Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Details */}
              <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 shadow-sm flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <h4 className="font-display font-bold text-base text-[#15191F] pb-2 border-b border-[#EEF1F4]">
                    {t.tracking.jobDetailsTitle}
                  </h4>

                  <div className="text-sm">
                    <span className="text-xs text-[#5B6572] block">{t.booking.steps.service}</span>
                    <strong className="text-[#15191F]">
                      {language === 'ur' ? currentBooking.serviceNameUr : currentBooking.serviceNameEn}
                    </strong>
                  </div>

                  <div className="text-sm">
                    <span className="text-xs text-[#5B6572] block">{t.booking.steps.schedule}</span>
                    <span className="text-[#15191F] font-medium">
                      {formatDate(currentBooking.scheduledStart)}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="text-xs text-[#5B6572] block">{t.booking.steps.address}</span>
                    <span className="text-[#15191F] font-medium">
                      {currentBooking.areaName}, {currentBooking.city}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="text-xs text-[#5B6572] block">{t.booking.steps.problem}</span>
                    <p className="text-xs text-[#5B6572] mt-0.5 line-clamp-3 bg-neutral-50 p-2.5 rounded-lg border border-[#EEF1F4]">
                      {currentBooking.problemDescription}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EEF1F4]">
                  <InspectionNotice variant="inline" />
                </div>
              </div>

              {/* Technician & Actions */}
              <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 shadow-sm flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <h4 className="font-display font-bold text-base text-[#15191F] pb-2 border-b border-[#EEF1F4]">
                    {t.tracking.technicianTitle}
                  </h4>

                  {currentBooking.assignedTechnicianName ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-[#EEF1F4]">
                      <div className="w-11 h-11 rounded-full bg-[#15191F] text-[#FFC928] flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#15191F]">
                          {currentBooking.assignedTechnicianName}
                        </div>
                        <div className="text-xs text-[#1E8E5A] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'ur' ? 'مصدقہ الیکٹریشن تفویض شدہ' : 'Certified Electrician Assigned'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[#FFF4CC]/50 border border-[#FFE082] text-xs text-[#5B6572]">
                      {language === 'ur'
                        ? 'آپ کی بکنگ کی توثیق کے بعد ڈسپیچ مینیجر فورا الیکٹریشن مقرر کر دے گا۔'
                        : 'A certified electrician is being assigned upon slot dispatch verification.'}
                    </div>
                  )}

                  {/* Actions (if booking still pending/confirmed) */}
                  {(currentBooking.status === 'pending' || currentBooking.status === 'confirmed') && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-[#5B6572] block mb-2">
                        {t.tracking.actionsTitle}
                      </span>
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => setShowRescheduleModal(true)}
                          className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F] hover:bg-[#D5DBE1] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t.tracking.rescheduleButton}</span>
                        </button>

                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-[#FDE8E8] text-[#C62828] hover:bg-[#F8B4B4] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t.tracking.cancelButton}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[#5B6572] bg-neutral-50 p-2.5 rounded-lg border border-[#EEF1F4]">
                  {t.tracking.cancelNotice}
                </div>
              </div>
            </div>

            {/* Booking History Audit Trail */}
            <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 shadow-sm">
              <h4 className="font-display font-bold text-base text-[#15191F] mb-4">
                {t.tracking.timelineTitle}
              </h4>
              <div className="space-y-3">
                {currentBooking.history.map((hist) => (
                  <div key={hist.id} className="flex items-start gap-3 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#B26A00] mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-[#15191F]">{hist.changedBy}:</span>{' '}
                      <span className="text-[#2A313B]">{hist.note}</span>
                      <span className="text-[11px] text-[#5B6572] block mt-0.5">
                        {formatDate(hist.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h3 className="font-bold text-lg text-[#15191F] mb-2">
                {t.tracking.cancelButton}
              </h3>
              <p className="text-xs text-[#5B6572] mb-4">
                {language === 'ur'
                  ? 'کیا آپ واقعی اس اپائنٹمنٹ کو منسوخ کرنا چاہتے ہیں؟ منسوخی کی وجہ درج کریں۔'
                  : 'Are you sure you want to cancel this booking? Please provide a brief reason.'}
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Problem was resolved, or schedule change"
                className="w-full p-3 rounded-lg border border-[#D5DBE1] text-xs outline-none mb-4"
                rows={3}
              />
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
                >
                  {t.common.close}
                </button>
                <button
                  onClick={handleCancelSubmit}
                  disabled={isActionLoading}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#C62828] text-white hover:bg-[#B71C1C] disabled:opacity-60 disabled:cursor-wait"
                >
                  {t.common.confirm}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Slot Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h3 className="font-bold text-lg text-[#15191F] mb-2">
                {t.tracking.rescheduleButton}
              </h3>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-[#5B6572] block mb-1">
                    {t.booking.dateLabel}
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setNewDate(e.target.value);
                      setNewSlot('');
                    }}
                    className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5B6572] block mb-1">
                    {t.booking.timeSlotLabel}
                  </label>
                  {isLoadingRescheduleSlots && (
                    <p className="mb-2 text-xs text-[#5B6572]">
                      {language === 'ur' ? 'اوقات چیک ہو رہے ہیں…' : 'Checking live availability…'}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {availableRescheduleSlots.map((slot, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setNewSlot(slot.time)}
                        className={`p-2 rounded-lg border text-xs text-start flex justify-between ${
                          !slot.available
                            ? 'opacity-40 line-through'
                            : newSlot === slot.time
                            ? 'border-[#15191F] bg-[#FFF4CC] font-bold'
                            : 'border-[#D5DBE1]'
                        }`}
                      >
                        <span>{slot.time}</span>
                        <span>{slot.available ? 'Available' : 'Booked'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
                >
                  {t.common.cancel}
                </button>
                <button
                  disabled={!newSlot || isActionLoading}
                  onClick={handleRescheduleSubmit}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#15191F] text-[#FFC928] disabled:opacity-50 disabled:cursor-wait"
                >
                  {t.common.confirm}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
