import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Zap,
  Info,
} from 'lucide-react';

interface AIDiagnosticsPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AIDiagnosticsPage: React.FC<AIDiagnosticsPageProps> = ({ onNavigate }) => {
  const { language, direction, t } = useLanguage();

  const [problemDescription, setProblemDescription] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [applianceDetails, setApplianceDetails] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim()) {
      setErrorMessage(
        language === 'ur'
          ? 'برائے مہربانی خرابی کی تفصیل درج کریں۔'
          : 'Please provide a description of the issue.'
      );
      return;
    }

    setErrorMessage('');
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problemDescription,
          symptoms,
          applianceDetails,
          language,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Server diagnostic error');
      }

      setAnalysisResult(data.analysis);
      setDisclaimer(data.disclaimer);
    } catch (err: any) {
      console.warn('API error, providing intelligent fallback guidance', err);
      // Client-side fallback if server api is unavailable
      setAnalysisResult(
        language === 'ur'
          ? `### 1. حفاظتی خطرات کا تجزیہ:
اگر آپ کو جلنے کی بو یا چنگاریاں محسوس ہو رہی ہیں تو فوری طور پر مین بریکر آف کر دیں۔ گیلے ہاتھوں سے بجلی کے آلات کو ہرگز نہ چھوئیں۔

### 2. ممکنہ وجوہات:
- نیوٹرل تار کا ڈھیلا ہونا یا اوورلوڈ سرکٹ
- غیر معیاری سرکٹ بریکر یا لیکیج کرنٹ
- موٹر یا انورٹر کا ہائی ان رَش کرنٹ

### 3. تجویز کردہ اقدام:
فوری طور پر ہمارے مستند الیکٹریشن سے معائنہ کروائیں۔ ڈسٹری بیوشن باکس اور ارتھنگ ٹیسٹنگ درکار ہے۔`
          : `### 1. Life-Safety & Hazard Evaluation:
If you notice sparks, acrid burning plastic odors, or warm distribution switches, immediately disconnect your main circuit breaker if safe to approach. Keep children away from the distribution area.

### 2. Probable Engineering Root Causes:
- High-impedance loose terminal connection generating localized resistive heating.
- Overcurrent tripping caused by simultaneous inductive motor loads (AC compressor + water pump).
- Ground-fault leakage through moisture or compromised wire insulation.

### 3. Recommended Resolution:
Book a Distribution Board & Breaker Repair inspection with calibrated multimeter and thermal imaging.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="py-12 lg:py-16 bg-neutral-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFC928]/20 text-[#B26A00] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#E6B000]" />
            <span>{t.aiDiag.badge}</span>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#15191F]">
            {t.aiDiag.title}
          </h1>

          <p className="text-sm sm:text-base text-[#5B6572] mt-2 leading-relaxed">
            {t.aiDiag.subtitle}
          </p>
        </div>

        {/* Input Form Card */}
        <div className="bg-white rounded-2xl border border-[#D5DBE1] p-6 sm:p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#C62828] text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleDiagnose} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#15191F] mb-1.5">
                {language === 'ur' ? 'برقی خرابی کی تفصیل درج کریں' : 'What electrical issue are you experiencing?'} <span className="text-[#C62828]">*</span>
              </label>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                rows={4}
                placeholder={t.aiDiag.inputPlaceholder}
                className="w-full p-4 rounded-xl border border-[#D5DBE1] focus:border-[#15191F] focus:ring-1 focus:ring-[#15191F] text-sm outline-none resize-none leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#15191F] mb-1">
                  {t.aiDiag.symptomsLabel}
                </label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={t.aiDiag.symptomsPlaceholder}
                  className="w-full p-3 rounded-lg border border-[#D5DBE1] focus:border-[#15191F] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#15191F] mb-1">
                  {t.aiDiag.applianceLabel}
                </label>
                <input
                  type="text"
                  value={applianceDetails}
                  onChange={(e) => setApplianceDetails(e.target.value)}
                  placeholder={t.aiDiag.appliancePlaceholder}
                  className="w-full p-3 rounded-lg border border-[#D5DBE1] focus:border-[#15191F] text-sm outline-none"
                />
              </div>
            </div>

            {/* Quick Sample Queries */}
            <div>
              <span className="text-xs font-semibold text-[#5B6572] block mb-2">
                {language === 'ur' ? 'تجزیہ کے لیے مثالیں:' : 'Or tap a typical diagnostic scenario:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  language === 'ur' ? 'فریج کے باڈی کو چھونے پر جھٹکا' : 'Electric tingling shock when touching refrigerator',
                  language === 'ur' ? 'سولر انورٹر پر مین بریکر کا بار بار ٹرپ ہونا' : 'Main breaker trips repeatedly on hybrid solar changeover',
                  language === 'ur' ? 'واشنگ مشین چلانے پر فیوز اڑنا' : 'Washing machine causes circuit short and fuse blowout',
                  language === 'ur' ? 'سوئچ بورڈ کے اندر ہلکی چنگاریاں' : 'Intermittent sparking inside concealed switch box',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setProblemDescription(sample)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#EEF1F4] text-[#15191F] hover:bg-[#D5DBE1] transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-extrabold bg-[#15191F] text-[#FFC928] hover:bg-[#2A313B] shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#FFC928] border-t-transparent rounded-full animate-spin" />
                    <span>{t.aiDiag.analyzing}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-[#FFC928]" />
                    <span>{t.aiDiag.analyzeButton}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Card */}
        {analysisResult && (
          <div className="mt-8 bg-white rounded-2xl border-2 border-[#FFE082] p-6 sm:p-8 shadow-md animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#EEF1F4] text-[#15191F]">
              <Zap className="w-6 h-6 text-[#E6B000]" />
              <h3 className="font-display font-extrabold text-xl">
                {t.aiDiag.resultsTitle}
              </h3>
            </div>

            {/* Analysis Text formatted */}
            <div className="py-6 text-sm text-[#2A313B] space-y-4 leading-relaxed whitespace-pre-line font-normal">
              {analysisResult}
            </div>

            {/* Disclaimer */}
            {disclaimer && (
              <div className="p-4 rounded-xl bg-[#FFF4CC]/50 border border-[#FFE082] text-xs text-[#5B6572] flex items-start gap-2.5 mb-6">
                <Info className="w-4 h-4 text-[#B26A00] shrink-0 mt-0.5" />
                <span>{disclaimer}</span>
              </div>
            )}

            {/* Call to Action to Book */}
            <div className="p-5 rounded-xl bg-[#15191F] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-base text-white">
                  {language === 'ur' ? 'کاریگر کی بروقت مدد درکار ہے؟' : 'Ready to have a certified technician fix this?'}
                </h4>
                <p className="text-xs text-neutral-300">
                  {language === 'ur' ? 'ہمارا کاریگر درست آلات کے ساتھ پہنچے گا۔' : 'Book a verified inspection slot in under 3 minutes.'}
                </p>
              </div>

              <button
                onClick={() => onNavigate('book-service')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-bold bg-[#FFC928] text-[#15191F] hover:bg-[#E6B000] transition-colors whitespace-nowrap shadow-sm"
              >
                {t.aiDiag.bookThisService}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
