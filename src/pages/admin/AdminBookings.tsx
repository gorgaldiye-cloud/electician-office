import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { Booking, BookingStatus } from '../../types';
import {
  Search,
  Filter,
  UserCheck,
  RotateCw,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  X,
  Phone,
  Clock,
} from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const { language, t, formatMoney, formatDate } = useLanguage();
  const { currentStaff, canEditBookings } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>(() => repository.getBookings());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<BookingStatus>('confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [internalNoteText, setInternalNoteText] = useState('');

  const refreshBookings = () => {
    setBookings(repository.getBookings());
  };

  const technicians = repository.getTechnicians();

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.bookingReference.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.includes(q) ||
      b.serviceNameEn.toLowerCase().includes(q) ||
      b.areaName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleAssignTechnician = async () => {
    if (!selectedBooking || !selectedTechId || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await repository.assignOnlineTechnician(selectedBooking.id, selectedTechId, currentStaff.fullName);
      refreshBookings();
      setShowAssignModal(false);
      setSelectedTechId('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Technician could not be assigned.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedBooking || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await repository.updateOnlineBookingStatus(
        selectedBooking.id,
        newStatus,
        statusNote || `Updated by ${currentStaff.fullName}`,
        currentStaff.fullName
      );
      refreshBookings();
      setShowStatusModal(false);
      setStatusNote('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Booking status could not be saved.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedBooking || !internalNoteText.trim() || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await repository.addOnlineInternalNote(selectedBooking.id, internalNoteText, currentStaff.fullName);
      refreshBookings();
      setShowNoteModal(false);
      setInternalNoteText('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The internal note could not be saved.');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
            {t.admin.bookings}
          </h1>
          <p className="text-xs text-[#5B6572]">
            {language === 'ur'
              ? 'تمام اپائنٹمنٹس، تفویض کردہ الیکٹریشنز اور کام کی حالت کا انتظام'
              : 'Manage scheduling, technician assignments, status transitions, and customer notes.'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#D5DBE1] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute start-3 top-3 text-[#5B6572]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ur' ? 'ریفرنس، نام یا فون نمبر تلاش کریں...' : 'Search by reference, name, phone, area...'}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-[#D5DBE1] text-xs outline-none focus:border-[#15191F]"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-[#15191F] text-[#FFC928]'
                  : 'bg-[#EEF1F4] text-[#5B6572] hover:text-[#15191F]'
              }`}
            >
              {st === 'all'
                ? t.common.all
                : t.statusLabels[st as BookingStatus] || st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-[#D5DBE1] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-neutral-50 border-b border-[#EEF1F4] font-semibold text-[#5B6572]">
              <tr>
                <th className="py-3 px-4 text-start">{t.common.reference}</th>
                <th className="py-3 px-4 text-start">{t.common.customer}</th>
                <th className="py-3 px-4 text-start">{t.booking.steps.service}</th>
                <th className="py-3 px-4 text-start">{t.booking.steps.schedule}</th>
                <th className="py-3 px-4 text-start">{t.common.technician}</th>
                <th className="py-3 px-4 text-start">{t.common.status}</th>
                <th className="py-3 px-4 text-end">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1F4]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5B6572]">
                    {language === 'ur' ? 'کوئی بکنگ نہیں ملی۔' : 'No bookings found matching filter.'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#15191F] whitespace-nowrap">
                      {b.bookingReference}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-[#15191F]">{b.customerName}</div>
                      <div className="text-[11px] text-[#5B6572] font-mono">{b.customerPhone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#15191F] max-w-[200px] truncate">
                        {language === 'ur' ? b.serviceNameUr : b.serviceNameEn}
                      </div>
                      <div className="text-[11px] text-[#5B6572]">
                        {b.areaName}, {b.city}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[#2A313B]">
                      {formatDate(b.scheduledStart)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {b.assignedTechnicianName ? (
                        <span className="font-semibold text-[#15191F] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1E8E5A]" />
                          {b.assignedTechnicianName}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">
                          {language === 'ur' ? 'غیر تفویض شدہ' : 'Unassigned'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
                          b.status === 'completed'
                            ? 'bg-[#1E8E5A]/15 text-[#1E8E5A]'
                            : b.status === 'in_progress'
                            ? 'bg-[#FFC928] text-[#15191F]'
                            : b.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'cancelled' || b.status === 'rejected'
                            ? 'bg-[#FDE8E8] text-[#C62828]'
                            : 'bg-[#FFF4CC] text-[#B26A00]'
                        }`}
                      >
                        {t.statusLabels[b.status]}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-end whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Assign Tech */}
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setSelectedTechId(b.assignedTechnicianId || '');
                            setShowAssignModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-[#D5DBE1] hover:bg-[#EEF1F4] text-[#15191F]"
                          title="Assign Technician"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>

                        {/* Change Status */}
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setNewStatus(b.status);
                            setShowStatusModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-[#D5DBE1] hover:bg-[#EEF1F4] text-[#15191F]"
                          title="Change Status"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Internal Notes */}
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setShowNoteModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-[#D5DBE1] hover:bg-[#EEF1F4] text-[#15191F]"
                          title="Internal Notes"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSIGN TECHNICIAN MODAL */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F4] mb-4">
              <h3 className="font-bold text-base text-[#15191F]">
                {t.admin.assignTech} ({selectedBooking.bookingReference})
              </h3>
              <button onClick={() => setShowAssignModal(false)}>
                <X className="w-4 h-4 text-[#5B6572]" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <label className="text-xs font-semibold text-[#5B6572] block">
                {language === 'ur' ? 'الیکٹریشن منتخب کریں:' : 'Select Certified Electrician:'}
              </label>

              {technicians.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => setSelectedTechId(tech.id)}
                  className={`w-full p-3 rounded-xl border text-start flex items-center justify-between transition-colors ${
                    selectedTechId === tech.id
                      ? 'border-[#15191F] bg-[#FFF4CC] font-bold'
                      : 'border-[#D5DBE1] hover:bg-neutral-50'
                  }`}
                >
                  <div>
                    <span className="text-xs block font-bold text-[#15191F]">{tech.fullName}</span>
                    <span className="text-[11px] text-[#5B6572]">{tech.specializationEn}</span>
                  </div>
                  <span className="text-[11px] text-[#1E8E5A] font-semibold">Active</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
              >
                {t.common.cancel}
              </button>
              <button
                disabled={!selectedTechId || actionBusy}
                onClick={() => { void handleAssignTechnician(); }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#15191F] text-[#FFC928] disabled:opacity-50 disabled:cursor-wait"
              >
                {actionBusy ? (language === 'ur' ? 'محفوظ ہو رہا ہے…' : 'Saving…') : t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE STATUS MODAL */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F4] mb-4">
              <h3 className="font-bold text-base text-[#15191F]">
                {t.admin.changeStatus} ({selectedBooking.bookingReference})
              </h3>
              <button onClick={() => setShowStatusModal(false)}>
                <X className="w-4 h-4 text-[#5B6572]" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-[#5B6572] block mb-1">
                  {language === 'ur' ? 'نئی حالت' : 'New Status'}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs outline-none bg-white font-semibold"
                >
                  <option value="pending">{t.statusLabels.pending}</option>
                  <option value="confirmed">{t.statusLabels.confirmed}</option>
                  <option value="in_progress">{t.statusLabels.in_progress}</option>
                  <option value="completed">{t.statusLabels.completed}</option>
                  <option value="cancelled">{t.statusLabels.cancelled}</option>
                  <option value="rejected">{t.statusLabels.rejected}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5B6572] block mb-1">
                  {language === 'ur' ? 'تبدیلی کی وجہ یا نوٹ' : 'Transition Note'}
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Verified with customer via phone call"
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
              >
                {t.common.cancel}
              </button>
              <button
                disabled={actionBusy}
                onClick={() => { void handleStatusChange(); }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#15191F] text-[#FFC928] disabled:opacity-50 disabled:cursor-wait"
              >
                {actionBusy ? (language === 'ur' ? 'محفوظ ہو رہا ہے…' : 'Saving…') : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERNAL NOTE MODAL */}
      {showNoteModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F4] mb-4">
              <h3 className="font-bold text-base text-[#15191F]">
                {t.admin.addNote} ({selectedBooking.bookingReference})
              </h3>
              <button onClick={() => setShowNoteModal(false)}>
                <X className="w-4 h-4 text-[#5B6572]" />
              </button>
            </div>

            {selectedBooking.internalNotes && (
              <div className="p-3 rounded-lg bg-neutral-50 border border-[#EEF1F4] text-xs text-[#5B6572] mb-4 whitespace-pre-wrap">
                <span className="font-bold text-[#15191F] block mb-1">Previous Notes:</span>
                {selectedBooking.internalNotes}
              </div>
            )}

            <div className="mb-4">
              <textarea
                value={internalNoteText}
                onChange={(e) => setInternalNoteText(e.target.value)}
                placeholder="Add confidential technician or dispatch note..."
                rows={4}
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
              >
                {t.common.close}
              </button>
              <button
                disabled={actionBusy}
                onClick={() => { void handleAddNote(); }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#15191F] text-[#FFC928] disabled:opacity-50 disabled:cursor-wait"
              >
                {actionBusy ? (language === 'ur' ? 'محفوظ ہو رہا ہے…' : 'Saving…') : t.admin.addNote}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
