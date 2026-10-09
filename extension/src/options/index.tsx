import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { UserSettings } from '@/lib/types';
import { ShieldCheck, Moon, Sun, Sparkles, Volume2 } from 'lucide-react';
import '../sidepanel/sidepanel.css';

const SETTINGS_KEY = 'murmur_settings_v1';
const STORAGE_KEY = 'murmur_tasks_v1';

export const OptionsApp: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    userName: '',
    voiceFeedback: false,
    soundEffects: false,
    language: 'en-US',
    theme: 'system',
    motion: 'full',
  });
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    chrome.storage.local.get([SETTINGS_KEY], (res) => {
      if (res && res[SETTINGS_KEY]) {
        setSettings(res[SETTINGS_KEY]);
      }
    });
  }, []);

  const updateSetting = (partial: Partial<UserSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    chrome.storage.local.set({ [SETTINGS_KEY]: next });
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          chrome.storage.local.set({ [STORAGE_KEY]: imported }, () => {
            setImportStatus(`Successfully imported ${imported.length} tasks!`);
          });
        }
      } catch {
        setImportStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-xl mx-auto bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-subtle)] shadow-lg space-y-6">
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <h1 className="text-xl font-bold">Murmur Extension Settings</h1>
        <p className="text-xs text-neutral-500">Configure voice recognition and offline data sync</p>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            Your Name
          </label>
          <input
            type="text"
            value={settings.userName}
            onChange={(e) => updateSetting({ userName: e.target.value })}
            placeholder="e.g. Zaid"
            className="w-full p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Appearance
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateSetting({ theme: t })}
                className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize ${
                  settings.theme === t ? 'border-blue-600 bg-blue-50/50 text-blue-600' : 'border-neutral-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Data Migration
          </h2>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">
              Import tasks from Web App (JSON)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="text-xs text-neutral-500"
            />
            {importStatus && <div className="text-xs text-emerald-600 mt-1">{importStatus}</div>}
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>All tasks are stored locally on your device in chrome.storage.local.</span>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<OptionsApp />);
