import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { BusinessSettings } from '../../types';
import { Save, CheckCircle2, Shield, Settings } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { language, t } = useLanguage();
  const { currentStaff } = useAuth();

  const [settings, setSettings] = useState<BusinessSettings>(() => repository.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = (field: keyof BusinessSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    setSavedSuccess(false);
    try {
      await repository.updateOnlineBusinessSettings(settings, currentStaff.fullName);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Settings could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
            {t.admin.settings}
          </h1>
          <p className="text-xs text-[#5B6572]">
            {language === 'ur'
              ? 'کاروباری معلومات، فون نمبرز، پتے اور بکنگ کے اوقات کا انتظام'
              : 'Owner configuration of public business contacts, emergency hours, and dispatch slot buffers.'}
          </p>
        </div>
      </div>

      {saveError && (
        <div role="alert" className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {saveError}
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-[#1E8E5A]/15 border border-[#1E8E5A]/30 text-[#1E8E5A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully updated across website and dispatch engine!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#D5DBE1] p-6 sm:p-8 shadow-sm space-y-6">
        {/* Contact Identity */}
        <div>
          <h3 className="font-bold text-sm text-[#15191F] pb-2 border-b border-[#EEF1F4] mb-4 uppercase tracking-wider">
            1. Business Identification & Contact Channels
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#15191F] block mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#15191F] block mb-1">
                Primary Contact Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#15191F] block mb-1">
                Official Business Phone (E.164 format: +923463902834)
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => {
                  handleChange('phone', e.target.value);
                  handleChange('phoneDial', e.target.value);
                }}
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#15191F] block mb-1">
                Phone Display Format (e.g. 0346 3902834)
              </label>
              <input
                type="text"
                value={settings.phoneDisplay}
                onChange={(e) => {
                  handleChange('phoneDisplay', e.target.value);
                  handleChange('phonePlaceholder', e.target.value);
                }}
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs font-mono"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#15191F] block mb-1">
                WhatsApp Click-to-Chat (Leave blank to hide WhatsApp button per PRD v1.1 Decision 2)
              </label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="e.g. +923463902834 (empty = hidden)"
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs font-mono"
              />
              <span className="text-[11px] text-[#5B6572] mt-1 block">
                {settings.whatsapp ? '✓ WhatsApp button is active on website' : '○ WhatsApp button is hidden until confirmed by owner'}
              </span>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-xl bg-neutral-50 border border-[#EEF1F4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#15191F]">Public Pricing Policy</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#15191F] text-[#FFC928] uppercase">
                  {settings.pricingPublicDisplay || 'inspection_only'}
                </span>
              </div>
              <p className="text-[11px] text-[#5B6572]">
                Per PRD v1.1 Decision 3, public pricing is inspection-only. Internal quotes & invoices remain active in Admin.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[11px] font-semibold text-[#15191F] block mb-0.5">Fixed Notice (EN)</span>
                  <input
                    type="text"
                    value={settings.inspectionNoticeEn}
                    onChange={(e) => handleChange('inspectionNoticeEn', e.target.value)}
                    className="w-full p-2 rounded border border-[#D5DBE1] text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#15191F] block mb-0.5">Fixed Notice (UR)</span>
                  <input
                    type="text"
                    value={settings.inspectionNoticeUr}
                    onChange={(e) => handleChange('inspectionNoticeUr', e.target.value)}
                    className="w-full p-2 rounded border border-[#D5DBE1] text-xs text-end"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Address */}
        <div>
          <h3 className="font-bold text-sm text-[#15191F] pb-2 border-b border-[#EEF1F4] mb-4 uppercase tracking-wider">
            2. Headquarters Address & Operating Hours
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#15191F] block mb-1">
                Physical Address (English)
              </label>
              <input
                type="text"
                value={settings.addressEn}
                onChange={(e) => handleChange('addressEn', e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#15191F] block mb-1">
                دفتر کا پتہ (اردو)
              </label>
              <input
                type="text"
                value={settings.addressUr}
                onChange={(e) => handleChange('addressUr', e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs text-end font-urdu"
                dir="rtl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Operating Hours (English)
                </label>
                <input
                  type="text"
                  value={settings.operatingHoursEn}
                  onChange={(e) => handleChange('operatingHoursEn', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  دفتری اوقات (اردو)
                </label>
                <input
                  type="text"
                  value={settings.operatingHoursUr}
                  onChange={(e) => handleChange('operatingHoursUr', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs text-end font-urdu"
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Rules */}
        <div>
          <h3 className="font-bold text-sm text-[#15191F] pb-2 border-b border-[#EEF1F4] mb-4 uppercase tracking-wider">
            3. Slot Computation & Cancellation Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#15191F] block mb-1">
                Slot Interval (Minutes)
              </label>
              <input
                type="number"
                value={settings.slotIntervalMinutes}
                onChange={(e) => handleChange('slotIntervalMinutes', parseInt(e.target.value) || 60)}
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#15191F] block mb-1">
                Buffer Between Jobs (Minutes)
              </label>
              <input
                type="number"
                value={settings.bufferMinutes}
                onChange={(e) => handleChange('bufferMinutes', parseInt(e.target.value) || 30)}
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#15191F] block mb-1">
                Free Cancellation Window (Hours)
              </label>
              <input
                type="number"
                value={settings.cancellationWindowHours}
                onChange={(e) =>
                  handleChange('cancellationWindowHours', parseInt(e.target.value) || 4)
                }
                className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#EEF1F4] flex justify-end">
          <button
            type="submit"
                  disabled={isSaving}
            className="disabled:opacity-60 disabled:cursor-wait px-6 py-2.5 rounded-xl text-xs font-bold bg-[#15191F] text-[#FFC928] hover:bg-[#2A313B] transition-colors flex items-center gap-2 shadow-sm"
          >
            {isSaving
              ? (language === 'ur' ? 'محفوظ ہو رہا ہے…' : 'Saving…')
              : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings Changes</span>
                </>
              )}
          </button>
        </div>
      </form>
    </div>
  );
};
