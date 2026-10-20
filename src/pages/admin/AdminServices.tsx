import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { Service, PricingType } from '../../types';
import { Plus, Edit2, Check, X, Clock, Layers } from 'lucide-react';

export const AdminServices: React.FC = () => {
  const { language, t, formatMoney } = useLanguage();
  const { currentStaff } = useAuth();

  const [services, setServices] = useState<Service[]>(() => repository.getServices());
  const [editingService, setEditingService] = useState<Service | null>(null);

  const refresh = () => {
    setServices(repository.getServices());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    repository.saveService(editingService, currentStaff.fullName);
    setEditingService(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
            {t.admin.services}
          </h1>
          <p className="text-xs text-[#5B6572]">
            {language === 'ur'
              ? 'سروسز کی قیمتیں، اردو و انگریزی نام اور دورانیہ تبدیل کریں'
              : 'Configure service pricing models, bilingual titles, and estimated task durations.'}
          </p>
        </div>
      </div>

      {/* Services List Table */}
      <div className="bg-white rounded-2xl border border-[#D5DBE1] overflow-hidden shadow-sm">
        <table className="w-full text-start text-xs">
          <thead className="bg-neutral-50 border-b border-[#EEF1F4] text-[#5B6572] font-semibold">
            <tr>
              <th className="py-3.5 px-4 text-start">Service Name (EN / UR)</th>
              <th className="py-3.5 px-4 text-start">Pricing Type</th>
              <th className="py-3.5 px-4 text-start">Base Price</th>
              <th className="py-3.5 px-4 text-start">Duration</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-end">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F4]">
            {services.map((srv) => (
              <tr key={srv.id} className="hover:bg-neutral-50/50">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-[#15191F]">{srv.nameEn}</div>
                  <div className="text-[11px] text-[#5B6572] font-urdu">{srv.nameUr}</div>
                </td>

                <td className="py-3.5 px-4 text-[#5B6572] capitalize">
                  {srv.pricingType.replace('_', ' ')}
                </td>

                <td className="py-3.5 px-4 font-mono font-bold text-[#15191F]">
                  {srv.basePrice ? formatMoney(srv.basePrice) : 'Inspection Required'}
                </td>

                <td className="py-3.5 px-4 text-[#5B6572]">
                  {srv.estimatedDurationMinutes} mins
                </td>

                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      srv.isActive ? 'bg-[#1E8E5A]/15 text-[#1E8E5A]' : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    {srv.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-end">
                  <button
                    onClick={() => setEditingService({ ...srv })}
                    className="p-1.5 rounded-lg border border-[#D5DBE1] hover:bg-[#EEF1F4] text-[#15191F]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F4] mb-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                Edit Service: {editingService.nameEn}
              </h3>
              <button onClick={() => setEditingService(null)}>
                <X className="w-4 h-4 text-[#5B6572]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Service Name (English)
                </label>
                <input
                  type="text"
                  value={editingService.nameEn}
                  onChange={(e) => setEditingService({ ...editingService, nameEn: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  سروس کا نام (اردو)
                </label>
                <input
                  type="text"
                  value={editingService.nameUr}
                  onChange={(e) => setEditingService({ ...editingService, nameUr: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs text-end font-urdu"
                  dir="rtl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#15191F] block mb-1">
                    Pricing Model
                  </label>
                  <select
                    value={editingService.pricingType}
                    onChange={(e) =>
                      setEditingService({ ...editingService, pricingType: e.target.value as PricingType })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs bg-white"
                  >
                    <option value="starting_at">Starting at (PKR)</option>
                    <option value="inspection_required">Inspection Required</option>
                    <option value="estimate_required">Estimate Required</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#15191F] block mb-1">
                    Base Rate (PKR)
                  </label>
                  <input
                    type="number"
                    value={editingService.basePrice || ''}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        basePrice: parseFloat(e.target.value) || null,
                      })
                    }
                    placeholder="e.g. 1500"
                    className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>PRD v1.1 Policy Note:</strong> Public website is set to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">inspection_only</code>. All customer-facing cards and pages show <em>&ldquo;Charges will be confirmed after a live inspection&rdquo;</em>. Rates entered here remain private for internal quotes and estimates.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#15191F] block mb-1">
                    Estimated Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={editingService.estimatedDurationMinutes}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        estimatedDurationMinutes: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingService.isActive}
                    onChange={(e) =>
                      setEditingService({ ...editingService, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-[#15191F]"
                  />
                  <label htmlFor="isActive" className="text-xs font-semibold text-[#15191F]">
                    Is Active on Public Site
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#EEF1F4]">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#15191F] text-[#FFC928]"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
