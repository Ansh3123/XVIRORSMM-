import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 6000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {/* Toast Render Portal / Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => {
            let Icon = Info;
            let themeClass = 'bg-white border-gray-200 text-gray-900 shadow-lg';
            let iconColor = 'text-blue-500';

            switch (toast.type) {
              case 'success':
                Icon = CheckCircle2;
                themeClass = 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-100/40 shadow-md';
                iconColor = 'text-emerald-600';
                break;
              case 'error':
                Icon = XCircle;
                themeClass = 'bg-rose-50 border-rose-200 text-rose-950 shadow-rose-100/40 shadow-md';
                iconColor = 'text-rose-600';
                break;
              case 'warning':
                Icon = AlertTriangle;
                themeClass = 'bg-amber-50 border-amber-200 text-amber-950 shadow-amber-100/40 shadow-md';
                iconColor = 'text-amber-600';
                break;
              case 'info':
              default:
                Icon = Info;
                themeClass = 'bg-slate-50 border-slate-200 text-slate-950 shadow-slate-100/40 shadow-md';
                iconColor = 'text-slate-600';
                break;
            }

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${themeClass} overflow-hidden`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-sm font-semibold tracking-tight">{toast.title}</h4>
                  {toast.message && (
                    <p className="mt-1 text-xs leading-relaxed opacity-85 break-words">
                      {toast.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="flex-shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4 opacity-60 hover:opacity-100" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
