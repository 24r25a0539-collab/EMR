import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FileText,
  User,
  Building2,
  Pill,
  Calendar,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Patient' | 'Doctor' | 'Hospital' | 'Appointment' | 'Medical Record' | 'Medicine' | 'Navigation';
  path: string;
  keywords: string[];
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { role } = useAuth();
  const { t } = useLanguage();

  const allItems: SearchResultItem[] = [
    {
      id: 'p-1',
      title: 'Rahul Sharma (HP-100245)',
      subtitle: 'Patient • 38 Yrs • Blood: O +ve • Sovereign ID HP-100245',
      category: 'Patient',
      path: role === 'DOCTOR' ? '/doctor/patients?query=HP-100245' : '/patient/profile',
      keywords: ['rahul', 'sharma', 'hp-100245', '100245', 'patient'],
    },
    {
      id: 'p-2',
      title: 'Mohith Varma (HP-100246)',
      subtitle: 'Patient • 45 Yrs • Blood: B +ve • Sovereign ID HP-100246',
      category: 'Patient',
      path: role === 'DOCTOR' ? '/doctor/patients?query=HP-100246' : '/patient/profile',
      keywords: ['mohith', 'varma', 'hp-100246', '100246', 'patient'],
    },
    {
      id: 'p-3',
      title: 'Sneha Patel (HP-100247)',
      subtitle: 'Patient • 29 Yrs • Blood: A +ve • Sovereign ID HP-100247',
      category: 'Patient',
      path: role === 'DOCTOR' ? '/doctor/patients?query=HP-100247' : '/patient/profile',
      keywords: ['sneha', 'patel', 'hp-100247', '100247', 'patient'],
    },
    {
      id: 'd-1',
      title: 'Dr. Ananya Sharma (DOC-8921)',
      subtitle: 'Interventional Cardiologist • Apex Health City • NMC: TS-MCI-8921',
      category: 'Doctor',
      path: '/patient/doctors',
      keywords: ['ananya', 'sharma', 'doc-8921', '8921', 'cardiology', 'cardiologist', 'doctor'],
    },
    {
      id: 'd-2',
      title: 'Dr. Rajesh Verma (DOC-7412)',
      subtitle: 'Senior Neurologist • Care Hospital • NMC: TS-MCI-7412',
      category: 'Doctor',
      path: '/patient/doctors',
      keywords: ['rajesh', 'verma', 'doc-7412', '7412', 'neurology', 'neurologist', 'doctor'],
    },
    {
      id: 'd-3',
      title: 'Dr. Priya Nair (DOC-9102)',
      subtitle: 'Consultant Dermatologist • Skin & Aesthetics Clinic • NMC: TS-MCI-9102',
      category: 'Doctor',
      path: '/patient/doctors',
      keywords: ['priya', 'nair', 'doc-9102', '9102', 'dermatology', 'skin', 'doctor'],
    },
    {
      id: 'h-1',
      title: 'Apex National Health City',
      subtitle: 'Multi-Specialty Tertiary Hospital • 750 Beds • 24/7 Trauma Level 1',
      category: 'Hospital',
      path: '/patient/hospitals',
      keywords: ['apex', 'health', 'city', 'hospital', 'trauma', 'tertiary'],
    },
    {
      id: 'h-2',
      title: 'Care Super Specialty Medical Centre',
      subtitle: 'Cardiac & Neuro Hub • 450 Beds • Emergency Access Ready',
      category: 'Hospital',
      path: '/patient/hospitals',
      keywords: ['care', 'hospital', 'cardiac', 'neuro'],
    },
    {
      id: 'm-1',
      title: 'Metformin 500mg SR',
      subtitle: 'Twice daily with meals • 14 days remaining • Refill active',
      category: 'Medicine',
      path: '/patient/medicines',
      keywords: ['metformin', 'diabetes', 'medicine', 'refill'],
    },
    {
      id: 'm-2',
      title: 'Atorvastatin 20mg',
      subtitle: 'Once daily at bedtime • Lipid Management',
      category: 'Medicine',
      path: '/patient/medicines',
      keywords: ['atorvastatin', 'cholesterol', 'medicine'],
    },
    {
      id: 'r-1',
      title: 'Comprehensive Metabolic Panel (CMP)',
      subtitle: 'Lab Report • Published 2 days ago • Normal baseline',
      category: 'Medical Record',
      path: '/patient/lab-reports',
      keywords: ['cmp', 'metabolic', 'blood', 'report', 'lab'],
    },
    {
      id: 'n-1',
      title: 'Access & Privacy Console',
      subtitle: 'Manage doctor permissions and review consent grants',
      category: 'Navigation',
      path: '/patient/access-permissions',
      keywords: ['permissions', 'consent', 'privacy', 'access', 'grant', 'revoke'],
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setIsLoading(false);
      setIsError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setIsLoading(false);
      setIsError(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    const timer = setTimeout(() => {
      setIsLoading(false);
      if (query.includes('<script>') || query.includes('DROP TABLE')) {
        setIsError(true);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const results = q
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.includes(q))
      )
    : allItems.slice(0, 6);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  const getCategoryIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'Patient':
        return <User className="w-5 h-5 text-emerald-400" />;
      case 'Doctor':
        return <Stethoscope className="w-5 h-5 text-blue-400" />;
      case 'Hospital':
        return <Building2 className="w-5 h-5 text-teal-400" />;
      case 'Appointment':
        return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'Medical Record':
        return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'Medicine':
        return <Pill className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative max-w-2xl mx-auto bg-[#0B0B0D] rounded-3xl shadow-2xl border border-white/[0.12] overflow-hidden font-sans transition-colors">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 sm:px-5 border-b border-white/[0.08] bg-[#101012]">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder', 'Search by Patient ID (HP-100245), Doctor, Hospital, Appointment, Record...')}
            className="w-full py-4 text-white placeholder-slate-500 bg-transparent text-sm focus:outline-hidden"
          />

          {isLoading && (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin mr-2 flex-shrink-0" />
          )}

          {query && !isLoading && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg mr-2 transition-colors"
              title={t('search.clearSearch', 'Clear Search')}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-[#18181B] border border-white/[0.10] rounded">
            ESC
          </kbd>
        </div>

        {/* Search Content Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {isError ? (
            <div className="p-8 text-center space-y-2 text-xs">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="font-bold text-white">{t('search.errorTitle', 'Search Error')}</h4>
              <p className="text-slate-400">{t('search.errorMessage', 'Invalid search pattern entered. Please check your query.')}</p>
              <button
                onClick={() => setQuery('')}
                className="mt-2 text-blue-400 font-bold hover:underline"
              >
                {t('search.clearSearch', 'Clear Search')}
              </button>
            </div>
          ) : isLoading ? (
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-white/[0.06] rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-40 h-3.5 bg-white/[0.08] rounded" />
                  <div className="w-64 h-2.5 bg-white/[0.04] rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-white/[0.06] rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-48 h-3.5 bg-white/[0.08] rounded" />
                  <div className="w-56 h-2.5 bg-white/[0.04] rounded" />
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center space-y-2 text-xs">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-white text-sm">{t('search.noResultsTitle', 'No Matching Results')}</h4>
              <p className="text-slate-400 max-w-sm mx-auto">
                {t('search.noResultsDesc', 'No patient, doctor, hospital, appointment, or clinical record matches "{query}".', { query })}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {query.trim()
                  ? `${t('search.matchingResults', 'Matching Results')} (${results.length})`
                  : t('search.shortcuts', 'Recommended Shortcuts')}
              </div>

              {results.map((item) => {
                const categoryKey = `search.category${item.category.replace(/\s+/g, '')}`;
                const localizedCategory = t(categoryKey, item.category);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.path)}
                    className="w-full px-4 py-3 rounded-2xl flex items-center justify-between hover:bg-white/[0.06] text-left transition-colors group cursor-pointer border border-transparent hover:border-white/[0.08]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] group-hover:bg-white/[0.10] flex items-center justify-center flex-shrink-0">
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-blue-400 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 flex-shrink-0">
                            {localizedCategory}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 ml-3" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-[#101012] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
          <span>{t('search.footerDir', 'Search Sovereign EMR directory')}</span>
          <span>{t('search.footerEsc', 'Press ESC to dismiss')}</span>
        </div>
      </div>
    </div>
  );
};
