import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface BackButtonProps {
  to?: string;
  fallbackPath?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
  ariaLabel?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  fallbackPath,
  onClick,
  label,
  className = '',
  ariaLabel,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    } else if (to || fallbackPath) {
      navigate(to || fallbackPath!);
    } else {
      navigate(-1);
    }
  };

  const displayLabel = label || t('common.back', 'Back');

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel || displayLabel}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.14] bg-[#101012] transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 min-h-[38px] shadow-sm ${className}`}
    >
      <ArrowLeft className="w-4 h-4 flex-shrink-0 text-slate-400" />
      <span>{displayLabel}</span>
    </button>
  );
};
