import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { Booking } from '../../types';
import {
  Phone,
  MapPin,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Wrench,
  Navigation,
} from 'lucide-react';

export const AdminTechnicianView: React.FC = () => {
  const { language, t, formatMoney, formatDate } = useLanguage();
  const { currentStaff } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>(() => repository.getBookings());
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today');

  // Complete Job Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [finalAmount, setFinalAmount] = useState<string>('');
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const refresh = () => {
    setBookings(repository.getBookings());
  };

  // Filter jobs for this technician (or all if owner is previewing)
  const myJobs = bookings.filter((b) =>
    currentStaff.role === 'owner' || !b.assignedTechnicianId || b.assignedTechnicianId === currentStaff.id
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const todayJobs = myJobs.filter(
    (b) => b.scheduledStart.startsWith(todayStr) && b.status !== 'completed' && b.status !== 'cancelled'
  );

  const upcomingJobs = myJobs.filter(
    (b) => !b.scheduledStart.startsWith(todayStr) && b.status !== 'completed' && b.status !== 'cancelled'
  );

  const completedJobs = myJobs.filter((b) => b.status === 'completed');

  const handleStartJob = (bookingId: string) => {
    repository.updateBookingStatus(
      bookingId,
      'in_progress',
      `${currentStaff.fullName} arrived on site and started work`,
      currentStaff.fullName,
      'staff'
    );
    refresh();
  };

  const handleFinishJob = () => {
    if (!selectedBooking) return;
    const amountNum = parseFloat(finalAmount) || selectedBooking.estimatedAmount || 0;

    repository.updateBookingStatus(
      selectedBooking.id,
      'completed',
      completionNotes || 'Work successfully completed and tested on site',
      currentStaff.fullName,
      'staff'
    );

    // Also auto-generate an invoice if none exists
    repository.createInvoice(
      {
        bookingId: selectedBooking.id,
        bookingReference: selectedBooking.bookingReference,
        customerId: selectedBooking.customerId,
        customerName: selectedBooking.customerName,
        customerPhone: selectedBooking.customerPhone,
        customerAddress: `${selectedBooking.addressLine}, ${selectedBooking.areaName}, ${selectedBooking.city}`,
        status: 'issued',
        subtotal: amountNum,
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        total: amountNum,
        amountPaid: 0,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        notes: completionNotes,
        items: [
          {
            id: `item-${Date.now()}`,
            itemType: 'labor',
            description: selectedBooking.serviceNameEn,
            quantity: 1,
            unitPrice: amountNum,
            lineTotal: amountNum,
          },
        ],
        payments: [],
      },
      currentStaff.fullName
    );

    setShowCompleteModal(false);
    setSelectedBooking(null);
    setFinalAmount('');
    setCompletionNotes('');
    refresh();
  };

  const displayedJobs =
    activeTab === 'today'
      ? todayJobs
      : activeTab === 'upcoming'
      ? upcomingJobs
      : completedJobs;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
          {language === 'ur' ? 'الیکٹریشن ڈیوٹی پورٹل (موبائل ویو)' : 'Electrician On-Site Duty View'}
        </h1>
        <p className="text-xs text-[#5B6572]">
          {language === 'ur'
            ? 'آج کے تفویض کردہ کام، گاہک سے فون رابطہ اور کام کی تکمیل کا ریکارڈ'
            : 'Mobile-first job cards for active field electricians with tap-to-call and status reporting.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D5DBE1] pb-2">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'today'
              ? 'bg-[#15191F] text-[#FFC928]'
              : 'bg-white text-[#5B6572] border border-[#D5DBE1]'
          }`}
        >
          {language === 'ur' ? 'آج کے کام' : "Today's Jobs"} ({todayJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-[#15191F] text-[#FFC928]'
              : 'bg-white text-[#5B6572] border border-[#D5DBE1]'
          }`}
        >
          {language === 'ur' ? 'آئندہ کام' : 'Upcoming'} ({upcomingJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'completed'
              ? 'bg-[#15191F] text-[#FFC928]'
              : 'bg-white text-[#5B6572] border border-[#D5DBE1]'
          }`}
        >
          {language === 'ur' ? 'مکمل شدہ کام' : 'Completed'} ({completedJobs.length})
        </button>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {displayedJobs.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-[#D5DBE1] text-center text-xs text-[#5B6572]">
            {language === 'ur' ? 'اس ٹیب میں کوئی کام موجود نہیں ہے۔' : 'No jobs found in this category.'}
          </div>
        ) : (
          displayedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-[#D5DBE1] p-5 shadow-sm space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EEF1F4]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-[#EEF1F4] text-[#15191F] px-2 py-0.5 rounded">
                      {job.bookingReference}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        job.status === 'in_progress'
                          ? 'bg-[#FFC928] text-[#15191F]'
                          : job.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : job.status === 'completed'
                          ? 'bg-[#1E8E5A]/15 text-[#1E8E5A]'
                          : 'bg-[#FFF4CC] text-[#B26A00]'
                      }`}
                    >
                      {t.statusLabels[job.status]}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#15191F] mt-1.5">
                    {language === 'ur' ? job.serviceNameUr : job.serviceNameEn}
                  </h3>
                </div>

                <div className="text-end">
                  <span className="text-xs text-[#5B6572] block">
                    {formatDate(job.scheduledStart)}
                  </span>
                </div>
              </div>

              {/* Customer & Location Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#15191F]">
                    {job.customerName}
                  </span>
                  <a
                    href={`tel:${job.customerPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EEF1F4] hover:bg-[#D5DBE1] text-[#15191F] font-bold font-mono"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#1E8E5A]" />
                    <span>{job.customerPhone}</span>
                  </a>
                </div>

                <div className="flex items-start gap-1.5 text-[#5B6572]">
                  <MapPin className="w-3.5 h-3.5 text-[#B26A00] shrink-0 mt-0.5" />
                  <span>
                    {job.addressLine}, {job.areaName}, {job.city}
                  </span>
                </div>

                {/* Problem Description */}
                <div className="bg-neutral-50 p-3 rounded-xl border border-[#EEF1F4] text-[#2A313B]">
                  <strong className="block text-[#15191F] mb-0.5">Problem Description:</strong>
                  {job.problemDescription}
                </div>
              </div>

              {/* Technician Big Action Buttons */}
              {job.status !== 'completed' && job.status !== 'cancelled' && (
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  {job.status !== 'in_progress' ? (
                    <button
                      onClick={() => handleStartJob(job.id)}
                      className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[#15191F] text-[#FFC928] hover:bg-[#2A313B] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4" />
                      <span>{language === 'ur' ? 'کام شروع کریں (In Progress)' : 'Start Job (Arrived)'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedBooking(job);
                        setFinalAmount(job.estimatedAmount ? String(job.estimatedAmount) : '2000');
                        setShowCompleteModal(true);
                      }}
                      className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[#1E8E5A] text-white hover:bg-[#167046] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'ur' ? 'کام مکمل مارک کریں اور بل بنائیں' : 'Mark Completed & Bill'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Complete Job Modal */}
      {showCompleteModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg text-[#15191F] mb-1">
              {language === 'ur' ? 'کام کی تکمیل اور بلنگ' : 'Complete Job & Final Billing'}
            </h3>
            <p className="text-xs text-[#5B6572] mb-4">
              {language === 'ur'
                ? 'موقع پر گاہک سے طے شدہ حتمی رقم اور کام کے نوٹس درج کریں۔'
                : 'Enter the final agreed PKR amount and technical notes for the invoice.'}
            </p>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  {language === 'ur' ? 'حتمی رقم (PKR)' : 'Final Amount (PKR)'} *
                </label>
                <input
                  type="number"
                  value={finalAmount}
                  onChange={(e) => setFinalAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  {language === 'ur' ? 'تکنیکی نوٹس / مٹیریل تفصیل' : 'Completion & Workmanship Notes'}
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Replaced 32A MCB, tested circuit load at 18A, resolved neutral fault."
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleFinishJob}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#1E8E5A] text-white hover:bg-[#167046]"
              >
                {language === 'ur' ? 'کام مکمل کریں' : 'Confirm Completion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
