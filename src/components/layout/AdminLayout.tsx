import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import {
  LayoutDashboard,
  CalendarCheck,
  Wrench,
  FileText,
  FileSpreadsheet,
  Users,
  Settings,
  Layers,
  History,
  Shield,
  ArrowLeft,
  ArrowRight,
  LogOut,
  Bell,
  MessageSquare,
  UserCheck,
  Star,
} from 'lucide-react';
import { repository } from '../../data';

interface AdminLayoutProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onNavigateTab,
  onExitAdmin,
  children,
}) => {
  const { language, direction, t } = useLanguage();
  const { currentRole, currentStaff, isStaff, isLoading, authError, signIn, signOut, canViewRevenue, canManageSettings, canManageContent, isTechnician } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [recordsReady, setRecordsReady] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const pendingCount = repository.getBookings().filter((b) => b.status === 'pending').length;
  const newInquiriesCount = repository.getInquiries().filter((i) => i.status === 'new').length;

  if (isStaff && currentStaff && currentRole && (isLoadingRecords || !recordsReady)) {
    return (
      <div className="min-h-screen bg-[#EEF1F4] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[#D5DBE1] px-8 py-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-[#D5DBE1] border-t-[#B26A00] animate-spin" />
          <p className="font-semibold text-[#15191F]">{language === 'ur' ? 'محفوظ ریکارڈ لوڈ ہو رہے ہیں…' : 'Loading secure business records…'}</p>
          {recordsError && (
            <div className="mt-4 space-y-3">
              <p role="alert" className="text-sm text-red-700">{recordsError}</p>
              <button
                type="button"
                onClick={() => {
                  setIsLoadingRecords(true);
                  setRecordsError(null);
                  void repository.initializeRemoteAdminData()
                    .then(() => setRecordsReady(true))
                    .catch((error) => setRecordsError(error instanceof Error ? error.message : 'Unable to load staff records.'))
                    .finally(() => setIsLoadingRecords(false));
                }}
                className="rounded-lg bg-[#15191F] px-4 py-2 text-sm font-bold text-white"
              >
                {language === 'ur' ? 'دوبارہ کوشش کریں' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EEF1F4] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[#D5DBE1] px-8 py-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-[#D5DBE1] border-t-[#B26A00] animate-spin" />
          <p className="font-semibold text-[#15191F]">{language === 'ur' ? 'اسٹاف اکاؤنٹ کی تصدیق ہو رہی ہے…' : 'Verifying staff access…'}</p>
        </div>
      </div>
    );
  }

  if (!isStaff || !currentStaff || !currentRole) {
    return (
      <div className="min-h-screen bg-[#EEF1F4] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#D5DBE1] bg-white p-7 sm:p-9 shadow-sm">
          <div className="mb-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFC928]/20 text-[#B26A00] text-xl font-black">⚡</div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B26A00]">Private staff portal</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-[#15191F]">
              {language === 'ur' ? 'اسٹاف لاگ اِن' : 'Sign in to the operations portal'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6572]">
              {language === 'ur' ? 'صرف فعال اور مجاز اسٹاف اکاؤنٹس کو رسائی حاصل ہے۔' : 'Only active, authorized staff accounts can access bookings and customer records.'}
            </p>
          </div>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setIsSigningIn(true);
              setLoginMessage(null);
              try {
                await signIn(loginEmail, loginPassword);
              } catch (error) {
                setLoginMessage(error instanceof Error ? error.message : 'Sign-in failed. Please try again.');
              } finally {
                setIsSigningIn(false);
              }
            }}
          >
            <label className="block text-sm font-semibold text-[#2A313B]">
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#D5DBE1] px-3.5 py-3 outline-none focus:border-[#B26A00] focus:ring-2 focus:ring-[#FFC928]/30"
                placeholder="staff@example.com"
              />
            </label>
            <label className="block text-sm font-semibold text-[#2A313B]">
              {language === 'ur' ? 'پاس ورڈ' : 'Password'}
              <input
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#D5DBE1] px-3.5 py-3 outline-none focus:border-[#B26A00] focus:ring-2 focus:ring-[#FFC928]/30"
                placeholder="••••••••••"
              />
            </label>
            {(loginMessage || authError) && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                {loginMessage || authError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full rounded-xl bg-[#15191F] px-4 py-3 font-bold text-white transition-colors hover:bg-[#2A313B] disabled:cursor-wait disabled:opacity-60"
            >
              {isSigningIn ? (language === 'ur' ? 'لاگ اِن ہو رہا ہے…' : 'Signing in…') : (language === 'ur' ? 'لاگ اِن کریں' : 'Sign in securely')}
            </button>
          </form>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1F4] pt-5 text-xs">
            <button type="button" onClick={onExitAdmin} className="font-semibold text-[#5B6572] hover:text-[#15191F]">
              {language === 'ur' ? 'ویب سائٹ پر واپس جائیں' : 'Back to website'}
            </button>
            <button type="button" onClick={() => { void signOut().catch(() => undefined); }} className="font-semibold text-[#5B6572] hover:text-[#15191F]">
              {language === 'ur' ? 'دوسرا اکاؤنٹ استعمال کریں' : 'Use another account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let active = true;
    if (!isStaff || !currentStaff) {
      setRecordsReady(false);
      setRecordsError(null);
      return () => { active = false; };
    }

    setIsLoadingRecords(true);
    setRecordsError(null);
    void repository.initializeRemoteAdminData()
      .then(() => {
        if (active) setRecordsReady(true);
      })
      .catch((error) => {
        if (active) {
          setRecordsReady(false);
          setRecordsError(error instanceof Error ? error.message : 'Unable to load staff records.');
        }
      })
      .finally(() => {
        if (active) setIsLoadingRecords(false);
      });
    return () => { active = false; };
  }, [isStaff, currentStaff?.id]);

  const navItems = [
    { id: 'dashboard', label: t.admin.dashboard, icon: LayoutDashboard, show: true },
    {
      id: 'bookings',
      label: t.admin.bookings,
      icon: CalendarCheck,
      show: currentRole !== 'content_editor' && currentRole !== 'technician',
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'technician-view',
      label: t.admin.technicianView,
      icon: Wrench,
      show: isTechnician || currentRole === 'owner',
    },
    {
      id: 'quotes',
      label: t.admin.quotes,
      icon: FileSpreadsheet,
      show: currentRole === 'owner' || currentRole === 'booking_manager',
    },
    {
      id: 'invoices',
      label: t.admin.invoices,
      icon: FileText,
      show: currentRole === 'owner' || currentRole === 'booking_manager',
    },
    {
      id: 'customers',
      label: t.admin.customers,
      icon: Users,
      show: currentRole === 'owner' || currentRole === 'booking_manager',
    },
    {
      id: 'inquiries',
      label: t.admin.inquiries,
      icon: MessageSquare,
      show: currentRole === 'owner' || currentRole === 'booking_manager',
      badge: newInquiriesCount > 0 ? newInquiriesCount : undefined,
    },
    {
      id: 'staff',
      label: t.admin.staff,
      icon: UserCheck,
      show: currentRole === 'owner' || currentRole === 'booking_manager',
    },
    {
      id: 'services',
      label: t.admin.services,
      icon: Layers,
      show: canManageContent,
    },
    {
      id: 'reviews',
      label: t.admin.reviews,
      icon: Star,
      show: canManageContent,
    },
    {
      id: 'data-requests',
      label: t.admin.dataRequests,
      icon: Shield,
      show: currentRole === 'owner',
    },
    {
      id: 'settings',
      label: t.admin.settings,
      icon: Settings,
      show: canManageSettings,
    },
    {
      id: 'audit-logs',
      label: t.admin.auditLogs,
      icon: History,
      show: currentRole === 'owner',
    },
  ];

  return (
    <div className="min-h-screen bg-[#EEF1F4] flex flex-col">
      {/* Authenticated staff header — no client-side role switching. */}
      <div className="bg-[#15191F] text-white px-4 sm:px-6 py-3 border-b border-[#2A313B]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#FFC928] font-bold uppercase tracking-wider">Staff portal</span>
            <span className="font-bold bg-[#2A313B] px-2.5 py-1 rounded">{t.admin.roles[currentRole]}</span>
            <span className="text-neutral-300">{currentStaff.fullName}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onExitAdmin}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white text-[#15191F] hover:bg-neutral-200 transition-colors"
            >
              {language === 'ur' ? 'ویب سائٹ پر جائیں' : 'Exit portal'}
            </button>
            <button
              onClick={() => { void signOut().catch(() => undefined); }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3 h-3" />
              <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 hidden md:flex flex-col gap-1 bg-white rounded-2xl border border-[#D5DBE1] p-4 shadow-sm self-start sticky top-6">
          <div className="p-3 border-b border-[#EEF1F4] mb-2">
            <span className="font-display font-extrabold text-base text-[#15191F] block">
              {t.brand}
            </span>
            <span className="text-[11px] text-[#5B6572]">
              Operations & Management System
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigateTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-start ${
                      isActive
                        ? 'bg-[#15191F] text-[#FFC928]'
                        : 'text-[#2A313B] hover:bg-[#EEF1F4]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C62828] text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 min-w-0">
          {/* Mobile Tab Scroller for Admin on small screens */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-3 mb-4">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigateTab(item.id)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      isActive ? 'bg-[#15191F] text-[#FFC928]' : 'bg-white text-[#2A313B] border border-[#D5DBE1]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};
