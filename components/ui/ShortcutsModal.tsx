'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Command } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const SHORTCUTS = [
  { key: 'Space', desc: 'Push-to-talk / Toggle microphone (when not typing)' },
  { key: '⌘ / Ctrl + K', desc: 'Focus command bar' },
  { key: 'Enter', desc: 'Submit voice or typed command / Open task' },
  { key: '?', desc: 'Open keyboard shortcuts sheet' },
  { key: 'Esc', desc: 'Close dialogs and detail panel' },
];

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen } = useAppStore();

  if (!isShortcutsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-neutral-400 stroke-[1.5]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={() => setIsShortcutsOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
            aria-label="Close shortcuts"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs">
              <span className="text-neutral-600 dark:text-neutral-300">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono font-medium text-neutral-700 dark:text-neutral-300">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
