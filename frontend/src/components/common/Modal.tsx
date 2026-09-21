import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | string;
  showClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  size,
  showClose = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedWidth = size && ['sm', 'md', 'lg', 'xl', '2xl', '4xl'].includes(size) ? size : maxWidth;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[resolvedWidth as 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md page-fade-in overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-[#0B0B0D] rounded-[28px] w-full ${maxWidthClass} shadow-2xl border border-white/[0.12] overflow-hidden my-8 transition-all`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#101012]">
            <h3 className="text-base font-black text-white tracking-tight">{title}</h3>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-6 text-[#F5F5F5]">{children}</div>
      </div>
    </div>
  );
};
