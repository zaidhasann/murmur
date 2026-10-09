'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const OnboardingCard: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen } = useAppStore();

  if (!isOnboardingOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Welcome to Murmur
            </h2>
            <p className="text-xs text-neutral-500">
              The fastest way to capture tasks. Speaking is 3x faster than typing.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
            <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 stroke-[1.5]" />
              Natural Voice Commands:
            </div>
            <ul className="space-y-1 list-disc list-inside text-neutral-500 pl-1">
              <li>“Add buy oat milk tomorrow at 5pm”</li>
              <li>“Remind me to submit taxes, urgent priority, tag finance”</li>
              <li>“Mark buy oat milk as done”</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[1.5] shrink-0" />
            <span>
              Microphone permission is required for voice capture. No audio ever leaves your computer.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(false)}
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOnboardingOpen(false);
              // Prompt mic permission
              navigator.mediaDevices?.getUserMedia({ audio: true }).catch(() => {});
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Enable Mic & Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
