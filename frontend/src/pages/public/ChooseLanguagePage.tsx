import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { Header } from '../../components/common/Header';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export const ChooseLanguagePage: React.FC = () => {
  const { language, setLanguage, languages, t } = useLanguage();
  const navigate = useNavigate();

  const handleSelectLanguage = (code: Language) => {
    setLanguage(code);
  };

  const handleContinue = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#050506] flex flex-col antialiased text-white">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <ScrollReveal direction="down" className="text-center max-w-xl mx-auto mb-10">
          <div className="w-14 h-14 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-500/20 shadow-lg shadow-teal-950/40">
            <Globe className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Choose Your Preferred Language
          </h1>
          <p className="text-sm text-white/60 mt-2">
            Select your language for all healthcare instructions, clinical alerts, and digital
            prescriptions.
          </p>
        </ScrollReveal>

        {/* 6 Language Cards */}
        <ScrollRevealGroup staggerDelay={0.06} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`p-6 rounded-2xl text-left border transition-all flex flex-col justify-between relative group cursor-pointer ${
                  isSelected
                    ? 'border-teal-500 bg-[#0B0B0D] shadow-xl shadow-teal-950/40 ring-1 ring-teal-500/40'
                    : 'border-white/10 bg-[#0B0B0D]/80 hover:border-white/20 hover:bg-[#0B0B0D] hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                      {lang.code.toUpperCase()}
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-1 font-sans">
                      {lang.nativeName}
                    </h3>
                    <p className="text-sm font-medium text-white/60 mt-0.5">{lang.name}</p>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-teal-500 text-[#050506]'
                        : 'border border-white/20 text-transparent group-hover:border-white/40'
                    }`}
                  >
                    <Check className="w-4 h-4 font-bold" />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                  <span>{isSelected ? 'Current Active Language' : 'Click to select'}</span>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-teal-400 uppercase">Selected</span>
                  )}
                </div>
              </button>
            );
          })}
        </ScrollRevealGroup>

        {/* Continue & Back actions */}
        <ScrollReveal direction="up" className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 bg-[#0B0B0D] text-white/80 font-bold hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto flex-1 px-8 py-3 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 cursor-pointer"
          >
            <span>Confirm & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </ScrollReveal>
      </main>
    </div>
  );
};
