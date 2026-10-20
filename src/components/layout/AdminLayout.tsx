import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AppRole } from '../../types';
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
  const { currentRole, currentStaff, setRole, canViewRevenue, canManageSettings, canManageContent, isTechnician } = useAuth();
  const pendingCount = repository.getBookings().filter((b) => b.status === 'pending').length;
  const newInquiriesCount = repository.getInquiries().filter((i) => i.status === 'new').length;

  const rolesList: { role: AppRole; label: string }[] = [
    { role: 'owner', label: t.admin.roles.owner },
    { role: 'booking_manager', label: t.admin.roles.booking_manager },
    { role: 'technician', label: t.admin.roles.technician },
    { role: 'content_editor', label: t.admin.roles.content_editor },
  ];

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
      {/* Top Testing Switcher Banner */}
      <div className="bg-[#15191F] text-white px-4 sm:px-6 py-2 border-b border-[#2A313B]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#FFC928] font-bold uppercase tracking-wider">
              {t.admin.roleBadge}
            </span>
            <span className="font-bold text-white bg-[#2A313B] px-2 py-0.5 rounded">
              {t.admin.roles[currentRole]}
            </span>
            <span className="text-neutral-400 hidden sm:inline">
              ({currentStaff.fullName})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-neutral-400">{t.admin.switchRole}</span>
            {rolesList.map((item) => (
              <button
                key={item.role}
                onClick={() => setRole(item.role)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  currentRole === item.role
                    ? 'bg-[#FFC928] text-[#15191F]'
                    : 'bg-[#2A313B] text-neutral-300 hover:text-white'
                }`}
              >
                {item.role.replace('_', ' ').toUpperCase()}
              </button>
            ))}

            <button
              onClick={onExitAdmin}
              className="ms-2 px-3 py-1 rounded text-[11px] font-bold bg-white text-[#15191F] hover:bg-neutral-200 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>{language === 'ur' ? 'ویب سائٹ پر جائیں' : 'Exit Admin'}</span>
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
