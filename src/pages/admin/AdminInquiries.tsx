import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { CustomerInquiry } from '../../types';
import {
  MessageSquare,
  Phone,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface AdminInquiriesProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminInquiries: React.FC<AdminInquiriesProps> = ({ onNavigateTab }) => {
  const { language, t, formatDate } = useLanguage();
  const { currentStaff } = useAuth();

  const [inquiries, setInquiries] = useState<CustomerInquiry[]>(() => repository.getInquiries());
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'handled'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = () => {
    setInquiries(repository.getInquiries());
  };

  const handleStatusChange = async (id: string, status: 'new' | 'in_progress' | 'handled') => {
    if (busyId) return;
    setBusyId(id);
    setActionError(null);
    try {
      await repository.updateOnlineInquiryStatus(id, status, currentStaff.fullName);
      refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Inquiry status could not be saved.');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = inquiries.filter((inq) => (filter === 'all' ? true : inq.status === filter));

  return (
    <div className="space-y-6">
      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
            {language === 'ur' ? 'کسٹمر انکوائریز اور لیڈز' : 'Customer Inquiries & Leads'}
          </h1>
          <p className="text-xs text-[#5B6572]">
            {language === 'ur'
              ? 'ویب سائٹ کے رابطہ فارم سے موصولہ پیغامات اور کوٹیشن کی درخواستیں'
              : 'Incoming requests submitted via Contact form. Triage status and reply directly via phone or WhatsApp.'}
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#D5DBE1] rounded-xl self-start sm:self-auto">
          {(['all', 'new', 'in_progress', 'handled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === st ? 'bg-[#15191F] text-[#FFC928]' : 'text-[#5B6572] hover:text-[#15191F]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-[#D5DBE1] text-center text-xs text-[#5B6572]">
            No inquiries matching selected filter.
          </div>
        ) : (
          filtered.map((inq) => (
            <div
              key={inq.id}
              className="bg-white p-5 rounded-2xl border border-[#D5DBE1] shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EEF1F4]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#15191F]">{inq.fullName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inq.status === 'new'
                          ? 'bg-[#FDE8E8] text-[#C62828]'
                          : inq.status === 'in_progress'
                          ? 'bg-[#FFF4CC] text-[#B26A00]'
                          : 'bg-[#1E8E5A]/15 text-[#1E8E5A]'
                      }`}
                    >
                      {inq.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#B26A00] block mt-0.5">
                    Subject: {inq.subject}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#5B6572]">{formatDate(inq.createdAt)}</span>
                  <a
                    href={`https://wa.me/${inq.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-[#1E8E5A]/10 text-[#1E8E5A] hover:bg-[#1E8E5A]/20 transition-colors"
                    title="Open WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                  <a
                    href={`tel:${inq.phone}`}
                    className="p-1.5 rounded-lg bg-[#EEF1F4] text-[#15191F] hover:bg-[#D5DBE1] transition-colors"
                    title="Call Phone"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <p className="text-xs text-[#2A313B] leading-relaxed bg-neutral-50 p-3 rounded-xl border border-[#EEF1F4]">
                {inq.message}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-[#5B6572] font-mono">Phone: {inq.phone} {inq.email ? `· ${inq.email}` : ''}</span>

                <div className="flex items-center gap-2">
                  {inq.status !== 'handled' && (
                    <button
                      onClick={() => { void handleStatusChange(inq.id, 'handled'); }}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-[#1E8E5A] text-white hover:bg-[#167046] transition-colors"
                    >
                      Mark as Handled
                    </button>
                  )}
                  {inq.status === 'new' && (
                    <button
                      onClick={() => { void handleStatusChange(inq.id, 'in_progress'); }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F] hover:bg-[#D5DBE1]"
                    >
                      In Progress
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
