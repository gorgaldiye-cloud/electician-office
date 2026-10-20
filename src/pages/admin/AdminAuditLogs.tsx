import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { History, Shield } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const { language, t, formatDate } = useLanguage();
  const logs = repository.getAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
          {t.admin.auditLogs}
        </h1>
        <p className="text-xs text-[#5B6572]">
          {language === 'ur'
            ? 'سسٹم میں کیے گئے تمام اقدامات، اسٹیٹس تبدیلیوں اور ادائیگیوں کا غیر متغیر ریکارڈ'
            : 'Immutable append-only audit trail of status transitions, technician dispatches, invoice issuances, and settings changes.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#D5DBE1] overflow-hidden shadow-sm">
        <table className="w-full text-start text-xs">
          <thead className="bg-neutral-50 border-b border-[#EEF1F4] text-[#5B6572] font-semibold">
            <tr>
              <th className="py-3.5 px-4 text-start">Timestamp (PKT)</th>
              <th className="py-3.5 px-4 text-start">Actor</th>
              <th className="py-3.5 px-4 text-start">Role</th>
              <th className="py-3.5 px-4 text-start">Action</th>
              <th className="py-3.5 px-4 text-start">Target Entity</th>
              <th className="py-3.5 px-4 text-start">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F4]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-neutral-50/50">
                <td className="py-3.5 px-4 font-mono text-[#5B6572] whitespace-nowrap">
                  {formatDate(log.timestamp)}
                </td>
                <td className="py-3.5 px-4 font-bold text-[#15191F] whitespace-nowrap">
                  {log.actorName}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-[#EEF1F4] text-[#15191F] font-semibold text-[10px] uppercase">
                    {log.actorRole}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-[#B26A00] whitespace-nowrap">
                  {log.action}
                </td>
                <td className="py-3.5 px-4 font-mono text-[#5B6572] whitespace-nowrap">
                  {log.entityType} ({log.entityId})
                </td>
                <td className="py-3.5 px-4 text-[#2A313B] max-w-sm">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
