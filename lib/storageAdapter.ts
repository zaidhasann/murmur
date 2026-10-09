import { Task, UserSettings } from './types';

declare const chrome: any;

export interface StorageAdapter {
  getTasks(): Promise<Task[] | null>;
  setTasks(tasks: Task[]): Promise<void>;
  getSettings(): Promise<UserSettings | null>;
  setSettings(settings: UserSettings): Promise<void>;
  subscribe?(onTasksChanged: (tasks: Task[]) => void, onSettingsChanged?: (settings: UserSettings) => void): () => void;
}

const STORAGE_KEY = 'murmur_tasks_v1';
const SETTINGS_KEY = 'murmur_settings_v1';

/**
 * Default LocalStorage Adapter for Web App environment
 */
export class LocalStorageAdapter implements StorageAdapter {
  async getTasks(): Promise<Task[] | null> {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async setTasks(tasks: Task[]): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // quota or private mode
    }
  }

  async getSettings(): Promise<UserSettings | null> {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async setSettings(settings: UserSettings): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // quota
    }
  }

  subscribe(onTasksChanged: (tasks: Task[]) => void, onSettingsChanged?: (settings: UserSettings) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          onTasksChanged(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === SETTINGS_KEY && e.newValue && onSettingsChanged) {
        try {
          onSettingsChanged(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }
}

/**
 * Chrome Storage Adapter for MV3 Extension environment
 */
export class ChromeStorageAdapter implements StorageAdapter {
  async getTasks(): Promise<Task[] | null> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (res: Record<string, any>) => {
        resolve((res && res[STORAGE_KEY]) || null);
      });
    });
  }

  async setTasks(tasks: Task[]): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: tasks }, () => resolve());
    });
  }

  async getSettings(): Promise<UserSettings | null> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;
    return new Promise((resolve) => {
      chrome.storage.local.get([SETTINGS_KEY], (res: Record<string, any>) => {
        resolve((res && res[SETTINGS_KEY]) || null);
      });
    });
  }

  async setSettings(settings: UserSettings): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
    return new Promise((resolve) => {
      chrome.storage.local.set({ [SETTINGS_KEY]: settings }, () => resolve());
    });
  }

  subscribe(onTasksChanged: (tasks: Task[]) => void, onSettingsChanged?: (settings: UserSettings) => void): () => void {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return () => {};

    const listener = (changes: Record<string, { oldValue?: any; newValue?: any }>, areaName: string) => {
      if (areaName !== 'local') return;
      if (changes[STORAGE_KEY] && changes[STORAGE_KEY].newValue) {
        onTasksChanged(changes[STORAGE_KEY].newValue);
      }
      if (changes[SETTINGS_KEY] && changes[SETTINGS_KEY].newValue && onSettingsChanged) {
        onSettingsChanged(changes[SETTINGS_KEY].newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
}

export const defaultStorageAdapter = new LocalStorageAdapter();
