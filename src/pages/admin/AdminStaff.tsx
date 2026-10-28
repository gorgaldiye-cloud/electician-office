import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { Staff, StaffSchedule, AvailabilityBlock } from '../../types';
import {
  Users,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Shield,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';

export const AdminStaff: React.FC = () => {
  const { language, t, formatDate } = useLanguage();
  const { currentStaff, canManageStaff } = useAuth();

  const [staffList, setStaffList] = useState<Staff[]>(() => repository.getStaff());
  const [schedules, setSchedules] = useState<StaffSchedule[]>(() => repository.getStaffSchedules());
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(() => repository.getAvailabilityBlocks());
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Block Modal
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockTechId, setBlockTechId] = useState('');
  const [blockType, setBlockType] = useState<'holiday' | 'leave' | 'break' | 'maintenance' | 'other'>('leave');
  const [blockReason, setBlockReason] = useState('');
  const [blockStartDate, setBlockStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [blockEndDate, setBlockEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const refresh = () => {
    setStaffList(repository.getStaff());
    setSchedules(repository.getStaffSchedules());
    setBlocks(repository.getAvailabilityBlocks());
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockReason.trim() || actionBusy) return;

    const tech = staffList.find((s) => s.id === blockTechId);
    setActionBusy(true);
    setActionError(null);
    try {
      await repository.createOnlineAvailabilityBlock(
        {
          technicianId: blockTechId || undefined,
          technicianName: tech ? tech.fullName : undefined,
          startsAt: new Date(blockStartDate).toISOString(),
          endsAt: new Date(blockEndDate).toISOString(),
          blockType,
          reason: blockReason.trim(),
        },
        currentStaff.fullName
      );

      refresh();
      setShowBlockModal(false);
      setBlockReason('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The time-off block could not be saved.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await repository.deleteOnlineAvailabilityBlock(id, currentStaff.fullName);
      refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The time-off block could not be deleted.');
    } finally {
      setActionBusy(false);
    }
  };

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-8">
      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
          {language === 'ur' ? 'عملہ اور شفٹ کے اوقات (Staff & Availability)' : 'Staff, Shifts & Availability Blocks'}
        </h1>
        <p className="text-xs text-[#5B6572]">
          {language === 'ur'
            ? 'الیکٹریشنز کے کام کے دن، شفٹ کا وقت اور رخصت/چھٹی کے بلاکس کا انتظام'
            : 'Manage certified technicians, weekly shift hours, leave periods, and public holidays.'}
        </p>
      </div>

      {/* Staff Accounts Card */}
      <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-base text-[#15191F] pb-3 border-b border-[#EEF1F4] flex items-center justify-between">
          <span>Active Staff Members ({staffList.length})</span>
          <span className="text-xs text-[#5B6572] font-normal">Super Admin role controlled</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((member) => (
            <div key={member.id} className="p-4 rounded-xl border border-[#D5DBE1] bg-neutral-50/50 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-[#15191F]">{member.fullName}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEF1F4] text-[#15191F] uppercase">
                    {member.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-[#5B6572] font-mono">{member.phone}</div>
                <div className="text-[11px] text-[#5B6572] mt-1">
                  {language === 'ur' ? member.specializationUr : member.specializationEn}
                </div>
              </div>

              <div className="pt-2 border-t border-[#EEF1F4] flex items-center justify-between text-xs">
                <span className="text-[#1E8E5A] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{member.isActive ? 'Active' : 'Inactive'}</span>
                </span>
                <span className="text-[11px] text-[#5B6572]">{member.email}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Working Shifts */}
      <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-base text-[#15191F] pb-3 border-b border-[#EEF1F4]">
          Technician Weekly Shift Schedules
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-neutral-50 text-[#5B6572] font-semibold border-b border-[#EEF1F4]">
              <tr>
                <th className="py-2.5 px-4 text-start">Technician</th>
                <th className="py-2.5 px-4 text-start">Weekday</th>
                <th className="py-2.5 px-4 text-start">Shift Hours</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1F4]">
              {schedules.map((sch) => (
                <tr key={sch.id} className="hover:bg-neutral-50/50">
                  <td className="py-3 px-4 font-bold text-[#15191F]">{sch.technicianName}</td>
                  <td className="py-3 px-4 text-[#2A313B] font-semibold">{weekdays[sch.weekday]}</td>
                  <td className="py-3 px-4 font-mono text-[#5B6572]">{sch.startsAt} – {sch.endsAt} (PKT)</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E8E5A]/15 text-[#1E8E5A]">
                      Scheduled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Availability Blocks / Leave / Holidays */}
      <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F4]">
          <div>
            <h3 className="font-display font-bold text-base text-[#15191F]">
              Availability Blocks & Scheduled Leave
            </h3>
            <p className="text-xs text-[#5B6572]">
              Prevents double bookings during staff leave or public holidays.
            </p>
          </div>

          <button
            onClick={() => setShowBlockModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#15191F] text-[#FFC928] hover:bg-[#2A313B] transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Block / Leave</span>
          </button>
        </div>

        <div className="divide-y divide-[#EEF1F4]">
          {blocks.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#5B6572]">
              No active availability blocks.
            </div>
          ) : (
            blocks.map((blk) => (
              <div key={blk.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#15191F]">{blk.reason}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EEF1F4] text-[#15191F]">
                      {blk.blockType}
                    </span>
                  </div>
                  <span className="text-[#5B6572] text-[11px]">
                    {blk.technicianName ? `Technician: ${blk.technicianName}` : 'All Staff (Full Business)'} ·{' '}
                    {formatDate(blk.startsAt)} to {formatDate(blk.endsAt)}
                  </span>
                </div>

                <button
                  onClick={() => { void handleDeleteBlock(blk.id); }}
                  disabled={actionBusy}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                  title="Remove block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE BLOCK MODAL */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F4] mb-4">
              <h3 className="font-bold text-base text-[#15191F]">
                Add Availability Block
              </h3>
              <button onClick={() => setShowBlockModal(false)}>
                <X className="w-4 h-4 text-[#5B6572]" />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Applies to:
                </label>
                <select
                  value={blockTechId}
                  onChange={(e) => setBlockTechId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs bg-white"
                >
                  <option value="">Whole Company (All Technicians)</option>
                  {staffList
                    .filter((s) => s.role === 'technician')
                    .map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.fullName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Block Type
                </label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs bg-white"
                >
                  <option value="leave">Personal Leave / Sick</option>
                  <option value="holiday">Public Holiday</option>
                  <option value="break">Shift Break</option>
                  <option value="maintenance">Equipment Calibration</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#15191F] block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#D5DBE1] text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#15191F] block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#D5DBE1] text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Reason / Notes *
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Annual leave or Eid holiday"
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EEF1F4]">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#15191F] text-[#FFC928]"
                >
                  Save Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
