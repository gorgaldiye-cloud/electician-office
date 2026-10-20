import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { DataRequest } from '../../types';
import { Shield, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const AdminDataRequests: React.FC = () => {
  const { language, t, formatDate } = useLanguage();
  const { currentStaff } = useAuth();

  const [requests, setRequests] = useState<DataRequest[]>(() => repository.getDataRequests());

  const refresh = () => {
    setRequests(repository.getDataRequests());
  };

  const handleStatusChange = (id: string, status: 'open' | 'approved' | 'completed' | 'rejected') => {
    repository.updateDataRequestStatus(id, status, currentStaff.fullName);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
          {language === 'ur' ? 'پرائیویسی اور ڈیٹا ریکویسٹس' : 'Privacy & Data Protection Requests'}
        </h1>
        <p className="text-xs text-[#5B6572]">
          {language === 'ur'
            ? 'صارفین کی طرف سے ذاتی معلومات کی درستگی، اخراج یا ایکسپورٹ کی درخواستیں'
            : 'Manage customer GDPR/Privacy requests for personal data correction, anonymization, or export.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#D5DBE1] overflow-hidden shadow-sm">
        <table className="w-full text-start text-xs">
          <thead className="bg-neutral-50 border-b border-[#EEF1F4] text-[#5B6572] font-semibold">
            <tr>
              <th className="py-3 px-4 text-start">Customer</th>
              <th className="py-3 px-4 text-start">Phone</th>
              <th className="py-3 px-4 text-start">Request Type</th>
              <th className="py-3 px-4 text-start">Details</th>
              <th className="py-3 px-4 text-start">Status</th>
              <th className="py-3 px-4 text-end">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F4]">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#5B6572]">
                  No active privacy requests on file.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50/50">
                  <td className="py-3.5 px-4 font-bold text-[#15191F]">{r.customerName}</td>
                  <td className="py-3.5 px-4 font-mono text-[#5B6572]">{r.customerPhone}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EEF1F4] text-[#15191F]">
                      {r.requestType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#2A313B] max-w-xs">{r.details}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'completed'
                          ? 'bg-[#1E8E5A]/15 text-[#1E8E5A]'
                          : r.status === 'approved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-[#FFF4CC] text-[#B26A00]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-end">
                    {r.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(r.id, 'completed')}
                        className="px-3 py-1 rounded text-xs font-bold bg-[#1E8E5A] text-white hover:bg-[#167046]"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
