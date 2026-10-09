'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, AlertTriangle } from 'lucide-react';
import { Task } from '@/lib/types';

interface DisambiguationSheetProps {
  data: {
    isOpen: boolean;
    query: string;
    options: Task[];
    onSelect: (task: Task) => void;
  } | null;
  onClose: () => void;
}

export const DisambiguationSheet: React.FC<DisambiguationSheetProps> = ({ data, onClose }) => {
  if (!data || !data.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Which task did you mean?
            </h3>
            <p className="text-xs text-neutral-500">
              Multiple matches found for “{data.query}”. Say or tap a number.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {data.options.map((option, idx) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                data.onSelect(option);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 text-xs font-mono font-bold flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {option.title}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface ConfirmationDialogProps {
  data: {
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null;
  onClose: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ data, onClose }) => {
  if (!data || !data.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {data.title}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {data.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              data.onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};
