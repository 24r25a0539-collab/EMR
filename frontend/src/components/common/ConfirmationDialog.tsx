import React from 'react';
import { X, AlertTriangle, CheckCircle2, Info, AlertOctagon } from 'lucide-react';

export type DialogVariant = 'info' | 'success' | 'warning' | 'danger';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isDestructive = false,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const actualVariant: DialogVariant = isDestructive ? 'danger' : variant;

  const Icon = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertOctagon,
  }[actualVariant];

  const colors = {
    info: {
      iconBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20',
    },
    success: {
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    },
    warning: {
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      btn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20',
    },
    danger: {
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20',
    },
  }[actualVariant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md page-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="bg-[#0B0B0D] rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-white/[0.12] transform transition-all"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl flex-shrink-0 ${colors.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 id="dialog-title" className="text-lg font-bold text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/[0.06] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-slate-300 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${colors.btn} disabled:opacity-50`}
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
