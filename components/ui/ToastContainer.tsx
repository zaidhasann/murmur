'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { ToastMessage } from '@/store/useAppStore';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xl border border-neutral-700/50 dark:border-neutral-300 text-xs font-medium"
          >
            <span>{toast.message}</span>

            {toast.onAction && toast.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss(toast.id);
                }}
                className="ml-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors"
              >
                {toast.actionLabel}
              </button>
            )}

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="opacity-60 hover:opacity-100 transition-opacity p-0.5"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
