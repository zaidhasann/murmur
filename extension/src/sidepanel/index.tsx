import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Task, ViewFilter } from '@/lib/types';
import { parseCommand, fuzzyMatchScore } from '@/lib/parser';
import { TaskRow } from '@/components/features/TaskRow';
import { CommandBar } from '@/components/features/CommandBar';
import { MicOrb } from '@/components/features/MicOrb';
import { EmptyState } from '@/components/ui/EmptyState';
import { DetailPanel } from '@/components/features/DetailPanel';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { isToday, isTomorrow, isBefore } from 'date-fns';
import { Sun, Calendar, Inbox, CheckSquare, Sparkles } from 'lucide-react';
import './sidepanel.css';

const STORAGE_KEY = 'murmur_tasks_v1';

export const SidepanelApp: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<ViewFilter>('today');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Load from chrome.storage.local
  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY], (res) => {
      if (res && res[STORAGE_KEY]) {
        setTasks(res[STORAGE_KEY]);
      }
    });

    const listener = (changes: any, area: string) => {
      if (area === 'local' && changes[STORAGE_KEY]) {
        setTasks(changes[STORAGE_KEY].newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    chrome.storage.local.set({ [STORAGE_KEY]: newTasks });
  };

  const executeCommand = (text: string) => {
    const parsed = parseCommand(text);
    if (parsed.action.type === 'ADD') {
      const newTask: Task = {
        id: 'task_' + Math.random().toString(36).substring(2, 9),
        title: parsed.action.title,
        notes: parsed.action.notes || '',
        dueAt: parsed.action.dueAt || null,
        priority: parsed.action.priority || 'none',
        tags: parsed.action.tags || [],
        status: 'todo',
        createdAt: new Date().toISOString(),
        completedAt: null,
      };
      saveTasks([newTask, ...tasks]);
    } else if (parsed.action.type === 'COMPLETE') {
      const query = parsed.action.targetQuery;
      const target = tasks.find((t) => fuzzyMatchScore(query, t.title) > 0.4);
      if (target) {
        const next = tasks.map((t) =>
          t.id === target.id ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
        );
        saveTasks(next);
      }
    } else if (parsed.action.type === 'NAVIGATE') {
      setActiveTab(parsed.action.view);
    }
  };

  // Speech Recognition (direct in extension origin)
  const {
    state: speechState,
    interimTranscript,
    isSupported,
    audioVolume,
    toggleListening,
  } = useSpeechRecognition({
    onResult: (text) => executeCommand(text),
  });

  const toggleComplete = (id: string) => {
    const next = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status: t.status === 'completed' ? ('todo' as const) : ('completed' as const),
            completedAt: t.status === 'completed' ? null : new Date().toISOString(),
          }
        : t
    );
    saveTasks(next);
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter((t) => t.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    saveTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const visibleTasks = useMemo(() => {
    if (activeTab === 'today') {
      return tasks.filter((t) => {
        if (!t.dueAt) return false;
        const d = new Date(t.dueAt);
        return isToday(d) || (isBefore(d, new Date()) && t.status === 'todo');
      });
    }
    if (activeTab === 'upcoming') {
      return tasks.filter((t) => {
        if (!t.dueAt) return false;
        const d = new Date(t.dueAt);
        return isTomorrow(d) || (d.getTime() > Date.now() && !isToday(d));
      });
    }
    if (activeTab === 'completed') {
      return tasks.filter((t) => t.status === 'completed');
    }
    return tasks.filter((t) => t.status === 'todo');
  }, [tasks, activeTab]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  return (
    <div className="flex flex-col h-screen p-4 bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block" />
          <h1 className="text-base font-semibold tracking-tight">Murmur</h1>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">Side Panel</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg mb-4 text-xs font-medium">
        {(['today', 'upcoming', 'inbox', 'completed'] as ViewFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-md capitalize transition-all ${
              activeTab === tab
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Command Bar */}
      <div className="mb-4">
        <CommandBar
          interimTranscript={interimTranscript}
          isListening={speechState === 'listening'}
          onSubmit={executeCommand}
          onToggleListening={toggleListening}
          isSupported={isSupported}
        />
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-20">
        {visibleTasks.length === 0 ? (
          <EmptyState view={activeTab} onExampleClick={executeCommand} />
        ) : (
          visibleTasks.map((t, idx) => (
            <TaskRow
              key={t.id}
              task={t}
              index={idx}
              isSelected={selectedTaskId === t.id}
              onSelect={() => setSelectedTaskId(t.id)}
              onToggleComplete={() => toggleComplete(t.id)}
              onDelete={() => deleteTask(t.id)}
            />
          ))
        )}
      </div>

      {/* Floating Bottom Mic */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <MicOrb
          state={speechState}
          audioVolume={audioVolume}
          onClick={toggleListening}
          isSupported={isSupported}
        />
      </div>

      {/* Detail Panel */}
      {selectedTask && (
        <DetailPanel
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onToggleComplete={toggleComplete}
        />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<SidepanelApp />);
