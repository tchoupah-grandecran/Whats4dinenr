import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmer", variant = "danger" }) {
  if (!isOpen) return null;

  const colors = {
    danger: "bg-red-500 hover:bg-red-600",
    primary: "bg-[var(--color-accent-ocre)] hover:opacity-90"
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
      {/* Overlay avec flou */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose} />

      {/* Contenu de la Modal */}
      <div className="relative bg-white dark:bg-[var(--color-card-bg)] w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-[var(--color-card-border)] animate-scale-up">
        <button onClick={onClose} className="absolute right-6 top-6 text-[var(--color-app-text)]/20 hover:text-[var(--color-app-text)]/50">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${variant === 'danger' ? 'bg-red-50' : 'bg-[var(--color-accent-ocre)]/10'}`}>
            <AlertCircle size={32} className={variant === 'danger' ? 'text-red-500' : 'text-[var(--color-accent-ocre)]'} />
          </div>

          <h3 className="font-display text-2xl text-[var(--color-app-text)] mb-2">{title}</h3>
          <p className="text-[var(--color-app-text)]/60 text-sm leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`w-full py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-95 ${colors[variant]}`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-[var(--color-app-text)]/5 text-[var(--color-app-text)]/40 font-bold text-sm uppercase tracking-widest hover:bg-[var(--color-app-text)]/10 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
