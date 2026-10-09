'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, Moon, Sun, Sparkles, ShieldCheck, Languages } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const SettingsDialog: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, settings, updateSettings, tasks } = useAppStore();

  if (!isSettingsOpen) return null;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `murmur_tasks_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Preferences & Settings
          </h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
            aria-label="Close settings"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* User Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Your Name (for personalized greetings)
            </label>
            <input
              type="text"
              value={settings.userName}
              onChange={(e) => updateSettings({ userName: e.target.value })}
              placeholder="e.g. Zaid"
              className="w-full p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateSettings({ theme: t })}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize flex items-center justify-center gap-2 transition-all ${
                    settings.theme === t
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-[var(--border-subtle)] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {t === 'light' ? <Sun className="w-3.5 h-3.5" /> : t === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Motion */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Motion & Physics
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['full', 'reduced', 'off'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateSettings({ motion: m })}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize flex items-center justify-center transition-all ${
                    settings.motion === m
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-[var(--border-subtle)] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5" />
              Voice Recognition Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none"
            >
              <option value="en-US">English (United States)</option>
              <option value="en-IN">English (India)</option>
              <option value="en-GB">English (Great Britain)</option>
              <option value="hi-IN">Hindi (India)</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[var(--text-primary)]">Spoken Confirmations</div>
                <div className="text-xs text-neutral-500">Short spoken voice summaries after voice actions</div>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceFeedback}
                onChange={(e) => updateSettings({ voiceFeedback: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[var(--text-primary)]">Subtle Sound Cues</div>
                <div className="text-xs text-neutral-500">Synthetic Web Audio ticks and chimes</div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => updateSettings({ soundEffects: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[1.5]" />
              <span>Offline-first: 100% of your tasks and voice audio remain strictly on your device.</span>
            </div>
            <button
              type="button"
              onClick={handleExportJSON}
              className="w-full py-2 px-3 rounded-lg border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              Export tasks as JSON
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
