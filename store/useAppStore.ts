import { create } from 'zustand';
import { Task, ViewFilter, UserSettings, Priority } from '@/lib/types';
import { soundFX } from '@/lib/sound';
import { speakText } from '@/lib/speechSynthesis';

interface HistorySnapshot {
  tasks: Task[];
  description: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'info' | 'success' | 'error';
}

interface AppStore {
  // Tasks
  tasks: Task[];
  activeView: ViewFilter;
  selectedTag: string | null;
  priorityFilter: Priority | null;
  selectedTaskId: string | null;
  history: HistorySnapshot[];
  toasts: ToastMessage[];

  // Settings
  settings: UserSettings;

  // Dialogs and Disambiguation
  isSettingsOpen: boolean;
  isOnboardingOpen: boolean;
  isShortcutsOpen: boolean;
  disambiguationModal: {
    isOpen: boolean;
    query: string;
    options: Task[];
    onSelect: (task: Task) => void;
  } | null;
  confirmDialog: {
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null;

  // Actions
  setActiveView: (view: ViewFilter, tag?: string) => void;
  setPriorityFilter: (priority: Priority | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsOnboardingOpen: (open: boolean) => void;
  setIsShortcutsOpen: (open: boolean) => void;

  // Task operations
  addTask: (title: string, options?: { dueAt?: string | null; priority?: Priority; tags?: string[]; notes?: string }) => Task;
  completeTask: (id: string, forceStatus?: 'todo' | 'completed') => void;
  deleteTask: (id: string) => void;
  clearCompleted: () => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  reorderTasks: (newTasks: Task[]) => void;
  undo: () => void;

  // Disambiguation & Confirm dialogs
  setDisambiguation: (data: AppStore['disambiguationModal']) => void;
  setConfirmDialog: (data: AppStore['confirmDialog']) => void;

  // Toasts
  showToast: (message: string, options?: { actionLabel?: string; onAction?: () => void; type?: 'info' | 'success' | 'error' }) => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEY = 'murmur_tasks_v1';
const SETTINGS_KEY = 'murmur_settings_v1';

const defaultSettings: UserSettings = {
  userName: '',
  voiceFeedback: false,
  soundEffects: false,
  language: 'en-US',
  theme: 'system',
  motion: 'full',
};

// Seed sample tasks if initial empty
const initialTasksSeed: Task[] = [
  {
    id: 'seed-1',
    title: 'Welcome to Murmur — try pressing Space to talk',
    notes: 'Speak naturally: "Add review proposal tomorrow at 4pm" or "Mark welcome as done".',
    dueAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    priority: 'urgent',
    tags: ['murmur', 'guide'],
    status: 'todo',
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: 'seed-2',
    title: 'Review weekly design sprint presentation',
    notes: 'Sync with product and engineering leads.',
    dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    priority: 'high',
    tags: ['work', 'design'],
    status: 'todo',
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: 'seed-3',
    title: 'Pick up dark roast espresso beans',
    notes: 'From local roastery.',
    dueAt: new Date().toISOString(),
    priority: 'medium',
    tags: ['errands'],
    status: 'todo',
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
];

export const useAppStore = create<AppStore>((set, get) => {
  // Load local state safely
  let storedTasks: Task[] = initialTasksSeed;
  let storedSettings: UserSettings = defaultSettings;

  if (typeof window !== 'undefined') {
    try {
      const rawTasks = localStorage.getItem(STORAGE_KEY);
      if (rawTasks) storedTasks = JSON.parse(rawTasks);
      const rawSettings = localStorage.getItem(SETTINGS_KEY);
      if (rawSettings) storedSettings = { ...defaultSettings, ...JSON.parse(rawSettings) };
    } catch {
      // Fallback
    }
  }

  const persistTasks = (tasks: Task[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch {
        // storage quota
      }
    }
  };

  const persistSettings = (settings: UserSettings) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        // quota
      }
    }
  };

  return {
    tasks: storedTasks,
    activeView: 'inbox',
    selectedTag: null,
    priorityFilter: null,
    selectedTaskId: null,
    history: [],
    toasts: [],
    settings: storedSettings,
    isSettingsOpen: false,
    isOnboardingOpen: false,
    isShortcutsOpen: false,
    disambiguationModal: null,
    confirmDialog: null,

    setActiveView: (view, tag) => {
      set({ activeView: view, selectedTag: tag || null, priorityFilter: null });
    },

    setPriorityFilter: (priority) => {
      set({ priorityFilter: priority });
    },

    setSelectedTaskId: (id) => {
      set({ selectedTaskId: id });
    },

    updateSettings: (partial) => {
      set((state) => {
        const next = { ...state.settings, ...partial };
        persistSettings(next);
        // Apply theme to document
        if (typeof window !== 'undefined') {
          if (next.theme === 'dark' || (next.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return { settings: next };
      });
    },

    setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
    setIsOnboardingOpen: (open) => set({ isOnboardingOpen: open }),
    setIsShortcutsOpen: (open) => set({ isShortcutsOpen: open }),

    addTask: (title, options) => {
      const state = get();
      const newTask: Task = {
        id: 'task_' + Math.random().toString(36).substring(2, 9),
        title: title.trim(),
        notes: options?.notes || '',
        dueAt: options?.dueAt || null,
        priority: options?.priority || 'none',
        tags: options?.tags || [],
        status: 'todo',
        createdAt: new Date().toISOString(),
        completedAt: null,
      };

      const nextTasks = [newTask, ...state.tasks];
      const snapshot: HistorySnapshot = { tasks: state.tasks, description: `Add "${title}"` };

      set((s) => ({
        tasks: nextTasks,
        history: [snapshot, ...s.history.slice(0, 10)],
      }));
      persistTasks(nextTasks);

      if (state.settings.soundEffects) soundFX.playTick();
      if (state.settings.voiceFeedback) {
        speakText(`Added. ${newTask.title}`, state.settings.language);
      }

      get().showToast(`Added: ${newTask.title}`, {
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      });

      return newTask;
    },

    completeTask: (id, forceStatus) => {
      const state = get();
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return;

      const nextStatus = forceStatus !== undefined ? forceStatus : task.status === 'completed' ? 'todo' : 'completed';
      const isFinishing = nextStatus === 'completed';

      const nextTasks = state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: nextStatus,
              completedAt: isFinishing ? new Date().toISOString() : null,
            }
          : t
      );

      const snapshot: HistorySnapshot = {
        tasks: state.tasks,
        description: isFinishing ? `Completed "${task.title}"` : `Reopened "${task.title}"`,
      };

      set((s) => ({
        tasks: nextTasks,
        history: [snapshot, ...s.history.slice(0, 10)],
      }));
      persistTasks(nextTasks);

      if (isFinishing) {
        if (state.settings.soundEffects) soundFX.playChime();
        if (state.settings.voiceFeedback) speakText(`Completed ${task.title}`, state.settings.language);
      }

      get().showToast(isFinishing ? `Completed: ${task.title}` : `Reopened: ${task.title}`, {
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      });
    },

    deleteTask: (id) => {
      const state = get();
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return;

      const nextTasks = state.tasks.filter((t) => t.id !== id);
      const snapshot: HistorySnapshot = { tasks: state.tasks, description: `Delete "${task.title}"` };

      set((s) => ({
        tasks: nextTasks,
        selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
        history: [snapshot, ...s.history.slice(0, 10)],
      }));
      persistTasks(nextTasks);

      get().showToast(`Deleted "${task.title}"`, {
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      });
    },

    clearCompleted: () => {
      const state = get();
      const completedCount = state.tasks.filter((t) => t.status === 'completed').length;
      if (completedCount === 0) {
        get().showToast('No completed tasks to clear');
        return;
      }

      const nextTasks = state.tasks.filter((t) => t.status !== 'completed');
      const snapshot: HistorySnapshot = { tasks: state.tasks, description: 'Clear completed' };

      set((s) => ({
        tasks: nextTasks,
        history: [snapshot, ...s.history.slice(0, 10)],
      }));
      persistTasks(nextTasks);

      get().showToast(`Removed ${completedCount} completed tasks`, {
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      });
    },

    updateTask: (id, updates) => {
      const state = get();
      const nextTasks = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      set({ tasks: nextTasks });
      persistTasks(nextTasks);
    },

    reorderTasks: (newTasks) => {
      set({ tasks: newTasks });
      persistTasks(newTasks);
    },

    undo: () => {
      const state = get();
      if (state.history.length === 0) {
        get().showToast('Nothing to undo');
        return;
      }
      const [last, ...remainingHistory] = state.history;
      set({ tasks: last.tasks, history: remainingHistory });
      persistTasks(last.tasks);
      get().showToast(`Undone: ${last.description}`);
    },

    setDisambiguation: (data) => set({ disambiguationModal: data }),
    setConfirmDialog: (data) => set({ confirmDialog: data }),

    showToast: (message, options) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 7);
      const newToast: ToastMessage = {
        id,
        message,
        actionLabel: options?.actionLabel,
        onAction: options?.onAction,
        type: options?.type || 'info',
      };
      set((s) => ({ toasts: [...s.toasts, newToast] }));

      // Auto dismiss after 5s
      setTimeout(() => {
        get().removeToast(id);
      }, 5000);
    },

    removeToast: (id) => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    },
  };
});
