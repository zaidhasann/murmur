import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, ViewFilter } from '@/lib/types';
import { parseCommand, fuzzyMatchScore } from '@/lib/parser';
import { TaskRow } from '@/components/features/TaskRow';
import { CommandBar } from '@/components/features/CommandBar';
import { MicOrb } from '@/components/features/MicOrb';
import { EmptyState } from '@/components/ui/EmptyState';
import { DetailPanel } from '@/components/features/DetailPanel';
import { isToday, isTomorrow, isBefore } from 'date-fns';
import { X, ExternalLink, Calendar, CheckSquare, Sun, Sparkles } from 'lucide-react';
import { createSessionNonce } from '../adapters/messaging';

const STORAGE_KEY = 'murmur_tasks_v1';

interface ExpandedWidgetProps {
  onClose: () => void;
  openSidePanel?: () => void;
}

export const ExpandedWidget: React.FC<ExpandedWidgetProps> = ({ onClose, openSidePanel }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<ViewFilter>('today');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Voice state from extension-origin iframe
  const [speechState, setSpeechState] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [nonce, setNonce] = useState('');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Load and sync tasks from chrome.storage.local
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

  // Set up voice iframe listener
  useEffect(() => {
    const nextNonce = createSessionNonce();
    setNonce(nextNonce);

    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data) return;

      if (data.type === 'VOICE_STATE') {
        setSpeechState(data.payload);
      } else if (data.type === 'VOICE_RESULT') {
        if (data.payload.isFinal) {
          setInterimTranscript('');
          setSpeechState('processing');
          executeCommand(data.payload.final);
          setTimeout(() => setSpeechState('idle'), 500);
        } else {
          setInterimTranscript(data.payload.interim);
        }
      } else if (data.type === 'VOICE_ERROR') {
        setSpeechState('error');
        setTimeout(() => setSpeechState('idle'), 2500);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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

  const toggleListening = () => {
    if (!iframeRef.current?.contentWindow) return;
    if (speechState === 'listening') {
      iframeRef.current.contentWindow.postMessage({ type: 'STOP_LISTENING', nonce }, '*');
    } else {
      iframeRef.current.contentWindow.postMessage({ type: 'START_LISTENING', nonce, language: 'en-US' }, '*');
    }
  };

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.18 }}
      className="w-[340px] h-[480px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--text-primary)] pointer-events-auto"
    >
      {/* Hidden voice iframe running on extension origin */}
      <iframe
        ref={iframeRef}
        src={chrome.runtime.getURL('src/voice/voice.html')}
        allow="microphone"
        style={{ display: 'none' }}
      />

      {/* Widget Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-subtle)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block" />
          <span className="text-sm font-semibold tracking-tight">Murmur</span>
        </div>
        <div className="flex items-center gap-1">
          {openSidePanel && (
            <button
              onClick={openSidePanel}
              title="Open in Side Panel"
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex px-3 pt-2 gap-1 text-xs font-medium">
        {(['today', 'upcoming', 'completed'] as ViewFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1 rounded-md capitalize transition-all ${
              activeTab === tab
                ? 'bg-neutral-200 dark:bg-neutral-800 font-semibold'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Command Bar */}
      <div className="p-3">
        <CommandBar
          interimTranscript={interimTranscript}
          isListening={speechState === 'listening'}
          onSubmit={executeCommand}
          onToggleListening={toggleListening}
        />
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-16">
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

      {/* Floating Bottom Orb in Widget */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
        <MicOrb
          state={speechState}
          audioVolume={speechState === 'listening' ? 0.6 : 0}
          onClick={toggleListening}
        />
      </div>

      {/* Inline Detail Sheet */}
      {selectedTask && (
        <div className="absolute inset-0 bg-[var(--bg-surface)] z-30 flex flex-col">
          <DetailPanel
            task={selectedTask}
            onClose={() => setSelectedTaskId(null)}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onToggleComplete={toggleComplete}
          />
        </div>
      )}
    </motion.div>
  );
};
