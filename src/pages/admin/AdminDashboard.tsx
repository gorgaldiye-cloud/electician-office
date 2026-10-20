import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import {
  CalendarCheck,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users,
  ArrowRight,
  ArrowLeft,
  Wrench,
  ShieldAlert,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { language, t, formatMoney, formatDate } = useLanguage();
  const { canViewRevenue, currentRole } = useAuth();

  const bookings = repository.getBookings();
  const invoices = repository.getInvoices();
  const inquiries = repository.getInquiries();
  const technicians = repository.getTechnicians();

  // Metrics computation
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const inProgressBookings = bookings.filter((b) => b.status === 'in_progress');
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  // Today's appointments (Karachi date)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayAppointments = bookings.filter((b) => b.scheduledStart.startsWith(todayDateStr));

  // Financials (Owner role only per PRD §F2)
  const invoicedRevenue = invoices.reduce((acc, inv) => acc + (inv.status !== 'void' ? inv.total : 0), 0);
  const collectedRevenue = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const outstandingRevenue = Math.max(0, invoicedRevenue - collectedRevenue);

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
            {t.admin.dashboard}
          </h1>
          <p className="text-xs text-[#5B6572]">
            {language === 'ur'
              ? 'روزمرہ آپریشنز، سلاٹس کی تصدیق اور کاریگروں کی تفویض کا جائزہ'
              : 'Real-time overview of appointments, dispatch status, and field operations.'}
          </p>
        </div>

        <div className="text-xs font-semibold text-[#5B6572] bg-white px-3 py-1.5 rounded-lg border border-[#D5DBE1] self-start sm:self-auto">
          {language === 'ur' ? 'آج کی تاریخ:' : 'Date:'} <span className="text-[#15191F] font-bold">{todayDateStr}</span> (Asia/Karachi)
        </div>
      </div>

      {/* Operational KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D5DBE1] shadow-sm">
          <span className="text-xs text-[#5B6572] font-semibold block">{t.admin.stats.totalBookings}</span>
          <div className="text-2xl font-black text-[#15191F] mt-1">{totalBookings}</div>
          <span className="text-[11px] text-[#1E8E5A] font-semibold mt-1 block">
            {completedBookings.length} {language === 'ur' ? 'مکمل شدہ' : 'Completed'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D5DBE1] shadow-sm">
          <span className="text-xs text-[#5B6572] font-semibold block">{t.admin.stats.pendingBookings}</span>
          <div className="text-2xl font-black text-[#B26A00] mt-1">{pendingBookings.length}</div>
          <span className="text-[11px] text-[#B26A00] font-semibold mt-1 block">
            {language === 'ur' ? 'فوری تصدیق درکار' : 'Requires Confirmation'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D5DBE1] shadow-sm">
          <span className="text-xs text-[#5B6572] font-semibold block">{t.admin.stats.todayAppointments}</span>
          <div className="text-2xl font-black text-[#15191F] mt-1">{todayAppointments.length}</div>
          <span className="text-[11px] text-[#5B6572] mt-1 block">
            {inProgressBookings.length} {language === 'ur' ? 'جاری کام' : 'In Progress'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D5DBE1] shadow-sm">
          <span className="text-xs text-[#5B6572] font-semibold block">{language === 'ur' ? 'فعال الیکٹریشنز' : 'Field Technicians'}</span>
          <div className="text-2xl font-black text-[#15191F] mt-1">{technicians.length}</div>
          <span className="text-[11px] text-[#1E8E5A] font-semibold mt-1 block">
            100% {language === 'ur' ? 'آن ڈیوٹی' : 'Ready on Duty'}
          </span>
        </div>
      </div>

      {/* Financial KPI Row (Restricted to Owner per PRD §F1 / §F2) */}
      {canViewRevenue && (
        <div className="bg-[#15191F] text-white p-6 rounded-2xl border border-[#2A313B] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A313B] mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#FFC928]" />
              <h3 className="font-bold text-sm text-[#FFC928] uppercase tracking-wider">
                {language === 'ur' ? 'مالیاتی خلاصہ (صرف سپر ایڈمن)' : 'Financial Ledger & Cash Flow (Super Admin Only)'}
              </h3>
            </div>
            <span className="text-xs text-neutral-400">Currency: PKR</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <span className="text-xs text-neutral-400 block">{t.admin.stats.invoicedRevenue}</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {formatMoney(invoicedRevenue)}
              </div>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                {invoices.length} {language === 'ur' ? 'جاری کردہ رسیدیں' : 'issued invoices'}
              </span>
            </div>

            <div>
              <span className="text-xs text-neutral-400 block">{t.admin.stats.collectedRevenue}</span>
              <div className="text-2xl font-black text-[#FFC928] mt-1 font-mono">
                {formatMoney(collectedRevenue)}
              </div>
              <span className="text-[11px] text-[#1E8E5A] font-semibold mt-1 block">
                {language === 'ur' ? 'نقد و بینک وصولی' : 'Verified bank & cash receipts'}
              </span>
            </div>

            <div>
              <span className="text-xs text-neutral-400 block">{t.admin.stats.outstandingRevenue}</span>
              <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
                {formatMoney(outstandingRevenue)}
              </div>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                {language === 'ur' ? 'زیر التوا بقایا جات' : 'Receivable balance'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pending Triage Queue */}
      <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#EEF1F4] mb-4">
          <div>
            <h3 className="font-display font-bold text-base text-[#15191F]">
              {language === 'ur' ? 'نئی بکنگز جن کی تصدیق درکار ہے' : 'Pending Appointments Requiring Action'}
            </h3>
            <span className="text-xs text-[#5B6572]">
              {pendingBookings.length} {language === 'ur' ? 'درخواستیں منتظر ہیں' : 'appointments awaiting verification'}
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('bookings')}
            className="text-xs font-bold text-[#15191F] hover:text-[#B26A00] transition-colors"
          >
            {t.common.viewAll} →
          </button>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#5B6572]">
            {language === 'ur' ? 'اس وقت کوئی پینڈنگ بکنگ موجود نہیں ہے۔' : 'All appointment requests are confirmed and dispatched!'}
          </div>
        ) : (
          <div className="divide-y divide-[#EEF1F4]">
            {pendingBookings.map((b) => (
              <div key={b.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#15191F] bg-[#EEF1F4] px-2 py-0.5 rounded">
                      {b.bookingReference}
                    </span>
                    <span className="font-semibold text-sm text-[#15191F]">
                      {b.customerName}
                    </span>
                    <span className="text-xs text-[#5B6572]">
                      ({b.customerPhone})
                    </span>
                    {b.urgency === 'emergency' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FDE8E8] text-[#C62828]">
                        EMERGENCY
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[#5B6572]">
                    <strong className="text-[#2A313B]">
                      {language === 'ur' ? b.serviceNameUr : b.serviceNameEn}
                    </strong>{' '}
                    · {b.areaName}, {b.city} · {formatDate(b.scheduledStart)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigateTab('bookings')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#FFC928] text-[#15191F] hover:bg-[#E6B000] transition-colors"
                  >
                    {language === 'ur' ? 'جانچیں و تفویض کریں' : 'Triage & Assign'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Inquiries Queue */}
      <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#EEF1F4] mb-4">
          <div>
            <h3 className="font-display font-bold text-base text-[#15191F]">
              {language === 'ur' ? 'ویب سائٹ سے موصولہ انکوائریز' : 'Recent Customer Inquiries'}
            </h3>
            <span className="text-xs text-[#5B6572]">
              {inquiries.length} {language === 'ur' ? 'پیغامات' : 'inquiries received'}
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('inquiries')}
            className="text-xs font-bold text-[#15191F] hover:text-[#B26A00] transition-colors"
          >
            {t.common.viewAll} →
          </button>
        </div>

        <div className="space-y-3">
          {inquiries.slice(0, 3).map((inq) => (
            <div key={inq.id} className="p-4 rounded-xl bg-neutral-50 border border-[#EEF1F4] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#15191F]">{inq.fullName} ({inq.phone})</span>
                <span className="text-[#5B6572]">{formatDate(inq.createdAt)}</span>
              </div>
              <div className="text-xs font-semibold text-[#B26A00]">{inq.subject}</div>
              <p className="text-xs text-[#5B6572] leading-relaxed">{inq.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
