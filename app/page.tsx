'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { parseCommand, fuzzyMatchScore } from '@/lib/parser';
import { formatDueDate } from '@/lib/date';
import { Task, ViewFilter, Priority } from '@/lib/types';
import { MicOrb } from '@/components/features/MicOrb';
import { CommandBar } from '@/components/features/CommandBar';
import { TaskRow } from '@/components/features/TaskRow';
import { Sidebar } from '@/components/features/Sidebar';
import { DetailPanel } from '@/components/features/DetailPanel';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { DisambiguationSheet, ConfirmationDialog } from '@/components/ui/Modals';
import { SettingsDialog } from '@/components/ui/SettingsDialog';
import { ShortcutsModal } from '@/components/ui/ShortcutsModal';
import { OnboardingCard } from '@/components/ui/OnboardingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { isToday, isTomorrow, isBefore } from 'date-fns';
import { Check, Mic, Sun, Calendar, Inbox, CheckSquare, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MurmurApp() {
  const {
    tasks,
    activeView,
    selectedTag,
    priorityFilter,
    selectedTaskId,
    settings,
    toasts,
    disambiguationModal,
    confirmDialog,
    setActiveView,
    setSelectedTaskId,
    setPriorityFilter,
    addTask,
    completeTask,
    deleteTask,
    clearCompleted,
    updateTask,
    undo,
    showToast,
    removeToast,
    setIsSettingsOpen,
    setIsShortcutsOpen,
    setDisambiguation,
    setConfirmDialog,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
  }, []);

  // Dispatch Natural-Language Voice or Typed Command
  const executeCommandText = (rawText: string) => {
    const parsed = parseCommand(rawText);

    switch (parsed.action.type) {
      case 'ADD': {
        addTask(parsed.action.title, {
          dueAt: parsed.action.dueAt,
          priority: parsed.action.priority,
          tags: parsed.action.tags,
        });
        break;
      }

      case 'COMPLETE': {
        const query = parsed.action.targetQuery;
        const index = parsed.action.index;

        if (index !== undefined && index > 0) {
          const visible = getVisibleTasks();
          if (visible[index - 1]) {
            completeTask(visible[index - 1].id);
          } else {
            showToast(`Task #${index} not found`);
          }
          return;
        }

        // Fuzzy match by query
        const candidates = tasks
          .filter((t) => t.status === 'todo')
          .map((t) => ({ task: t, score: fuzzyMatchScore(query, t.title) }))
          .filter((item) => item.score > 0.4)
          .sort((a, b) => b.score - a.score);

        if (candidates.length === 0) {
          showToast(`No task matching "${query}" found`);
        } else if (candidates.length === 1 || candidates[0].score > 0.85) {
          completeTask(candidates[0].task.id);
        } else {
          // Disambiguation
          setDisambiguation({
            isOpen: true,
            query,
            options: candidates.slice(0, 3).map((c) => c.task),
            onSelect: (selected) => completeTask(selected.id),
          });
        }
        break;
      }

      case 'DELETE': {
        const query = parsed.action.targetQuery;
        const index = parsed.action.index;

        if (index !== undefined && index > 0) {
          const visible = getVisibleTasks();
          if (visible[index - 1]) {
            deleteTask(visible[index - 1].id);
          } else {
            showToast(`Task #${index} not found`);
          }
          return;
        }

        const candidates = tasks
          .map((t) => ({ task: t, score: fuzzyMatchScore(query, t.title) }))
          .filter((item) => item.score > 0.4)
          .sort((a, b) => b.score - a.score);

        if (candidates.length === 0) {
          showToast(`No task matching "${query}" found`);
        } else if (candidates.length === 1 || candidates[0].score > 0.85) {
          deleteTask(candidates[0].task.id);
        } else {
          setDisambiguation({
            isOpen: true,
            query,
            options: candidates.slice(0, 3).map((c) => c.task),
            onSelect: (selected) => deleteTask(selected.id),
          });
        }
        break;
      }

      case 'CLEAR_COMPLETED': {
        const completedCount = tasks.filter((t) => t.status === 'completed').length;
        if (completedCount === 0) {
          showToast('No completed tasks to delete');
          return;
        }

        // Confirm destructive voice action
        setConfirmDialog({
          isOpen: true,
          title: 'Delete all completed tasks?',
          description: `This will permanently remove ${completedCount} completed tasks.`,
          onConfirm: () => clearCompleted(),
        });
        break;
      }

      case 'EDIT': {
        const query = parsed.action.targetQuery;
        const target = tasks.find((t) => fuzzyMatchScore(query, t.title) > 0.5);
        if (target) {
          const updates: Partial<Task> = {};
          if (parsed.action.newTitle) updates.title = parsed.action.newTitle;
          if (parsed.action.newDueAt) updates.dueAt = parsed.action.newDueAt;
          updateTask(target.id, updates);
          showToast(`Updated "${target.title}"`);
        } else {
          showToast(`Could not find task "${query}" to update`);
        }
        break;
      }

      case 'PRIORITIZE': {
        const query = parsed.action.targetQuery;
        const index = parsed.action.index;
        let target: Task | undefined;

        if (index !== undefined && index > 0) {
          const visible = getVisibleTasks();
          target = visible[index - 1];
        } else {
          target = tasks.find((t) => fuzzyMatchScore(query, t.title) > 0.4);
        }

        if (target) {
          updateTask(target.id, { priority: parsed.action.priority });
          showToast(`Set "${target.title}" to ${parsed.action.priority} priority`);
        } else {
          showToast(`Could not find task to prioritize`);
        }
        break;
      }

      case 'NAVIGATE': {
        setActiveView(parsed.action.view, parsed.action.tag);
        if (parsed.action.priority) {
          setPriorityFilter(parsed.action.priority);
        }
        showToast(`Viewing ${parsed.action.view}`);
        break;
      }

      case 'READ_TASKS': {
        const todoTasks = tasks.filter((t) => t.status === 'todo');
        if (todoTasks.length === 0) {
          showToast('You have no open tasks!');
        } else {
          const count = todoTasks.length;
          showToast(`You have ${count} open task${count > 1 ? 's' : ''}: ${todoTasks.slice(0, 3).map((t) => t.title).join(', ')}`);
        }
        break;
      }

      case 'UNDO': {
        undo();
        break;
      }

      case 'UNKNOWN':
      default: {
        showToast(parsed.action.suggestion || 'Unrecognized command. Try typing in the bar.');
        break;
      }
    }
  };

  // Speech Recognition hook
  const {
    state: speechState,
    interimTranscript,
    errorMessage,
    isSupported,
    audioVolume,
    toggleListening,
    simulateVoiceInput,
  } = useSpeechRecognition({
    language: settings.language,
    onResult: (text) => {
      executeCommandText(text);
    },
  });

  // Global hotkeys (Space to toggle mic when not typing, ? for shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      if (e.code === 'Space' && !isInput && !e.repeat) {
        e.preventDefault();
        toggleListening();
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening, setIsShortcutsOpen]);

  // Compute tasks for active view
  const getVisibleTasks = () => {
    let filtered = tasks;

    if (priorityFilter) {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    if (activeView === 'today') {
      filtered = filtered.filter((t) => {
        if (!t.dueAt) return false;
        const d = new Date(t.dueAt);
        return isToday(d) || (isBefore(d, new Date()) && t.status === 'todo');
      });
    } else if (activeView === 'upcoming') {
      filtered = filtered.filter((t) => {
        if (!t.dueAt) return false;
        const d = new Date(t.dueAt);
        return isTomorrow(d) || (isAfterUpcoming(d) && t.status === 'todo');
      });
    } else if (activeView === 'completed') {
      filtered = filtered.filter((t) => t.status === 'completed');
    } else if (activeView === 'tag' && selectedTag) {
      filtered = filtered.filter((t) => t.tags.includes(selectedTag));
    }

    return filtered;
  };

  function isAfterUpcoming(d: Date) {
    const now = new Date();
    return d.getTime() > now.getTime() && !isToday(d) && !isTomorrow(d);
  }

  const visibleTasks = getVisibleTasks();

  // Grouped tasks (Overdue, Today, Tomorrow, Later) for the Main Column
  const groupedTasks = useMemo(() => {
    if (activeView === 'completed') {
      return { completed: visibleTasks };
    }

    const groups: {
      completed: Task[];
      overdue: Task[];
      today: Task[];
      tomorrow: Task[];
      later: Task[];
      noDate: Task[];
    } = {
      completed: [],
      overdue: [],
      today: [],
      tomorrow: [],
      later: [],
      noDate: [],
    };

    const now = currentDate || new Date('2026-10-10T00:00:00.000Z');

    visibleTasks.forEach((t) => {
      if (t.status === 'completed') return;

      if (!t.dueAt) {
        groups.noDate.push(t);
        return;
      }

      const d = new Date(t.dueAt);
      if (isBefore(d, now) && !isToday(d)) {
        groups.overdue.push(t);
      } else if (isToday(d)) {
        groups.today.push(t);
      } else if (isTomorrow(d)) {
        groups.tomorrow.push(t);
      } else {
        groups.later.push(t);
      }
    });

    return groups;
  }, [visibleTasks, activeView, currentDate]);

  // Daily Progress ring calculation
  const todayTasks = tasks.filter((t) => t.dueAt && isToday(new Date(t.dueAt)));
  const todayCompleted = todayTasks.filter((t) => t.status === 'completed').length;
  const progressPercent = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 100;

  // Selected Task for Detail Panel
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  // Distinct tags
  const distinctTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  // Counts for sidebar
  const counts = useMemo(() => {
    return {
      inbox: tasks.filter((t) => t.status === 'todo').length,
      today: tasks.filter((t) => t.status === 'todo' && t.dueAt && isToday(new Date(t.dueAt))).length,
      upcoming: tasks.filter((t) => t.status === 'todo' && t.dueAt && (isTomorrow(new Date(t.dueAt)) || isAfterUpcoming(new Date(t.dueAt)))).length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks]);

  // Dynamic Time-aware greeting
  const greeting = useMemo(() => {
    const hour = (currentDate || new Date('2026-10-10T12:00:00.000Z')).getHours();
    let prefix = 'Good morning';
    if (hour >= 12 && hour < 17) prefix = 'Good afternoon';
    else if (hour >= 17) prefix = 'Good evening';

    return settings.userName ? `${prefix}, ${settings.userName}` : prefix;
  }, [settings.userName, currentDate]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-app)]">
      {/* Left Sidebar (Desktop) */}
      <div className="hidden md:flex">
        <Sidebar
          activeView={activeView}
          selectedTag={selectedTag}
          counts={counts}
          tags={distinctTags}
          onSelectView={setActiveView}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      </div>

      {/* Main Column */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10 px-4 sm:px-8 py-6 max-w-[760px] mx-auto w-full">
        {/* Top Header & Greeting */}
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif tracking-tight text-[var(--text-primary)]">
              {greeting}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              {counts.today > 0
                ? `${counts.today} task${counts.today > 1 ? 's' : ''} scheduled for today`
                : 'All caught up for today'}
            </p>
          </div>

          {/* Progress ring */}
          {todayTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-neutral-200 dark:text-neutral-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600 transition-all duration-500 ease-out"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
                  {progressPercent}%
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Command Bar */}
        <div className="mb-6">
          <CommandBar
            interimTranscript={interimTranscript}
            isListening={speechState === 'listening'}
            onSubmit={executeCommandText}
            onToggleListening={toggleListening}
            isSupported={isSupported}
            motionSetting={settings.motion}
          />
        </div>

        {/* Browser Unsupported Notice Banner with Interactive Voice Simulation */}
        {!isSupported && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Microphone engine unsupported in this browser:</span>
              <span>Web Speech API is native to Chrome, Edge, and Safari. You can test voice parsing right now with one click:</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => simulateVoiceInput('Add buy coffee tomorrow at 4pm')}
                className="px-2.5 py-1.5 rounded-md bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 font-medium text-[11px] transition-colors"
              >
                🎙️ Simulate Voice
              </button>
            </div>
          </div>
        )}

        {/* Error message from Speech if any */}
        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Task Lists Grouped */}
        <div className="flex-1 space-y-6 pb-24">
          {activeView === 'completed' ? (
            groupedTasks.completed && groupedTasks.completed.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Completed ({groupedTasks.completed.length})
                  </span>
                  <button
                    onClick={clearCompleted}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                {groupedTasks.completed.map((t, idx) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    index={idx}
                    isSelected={selectedTaskId === t.id}
                    onSelect={() => setSelectedTaskId(t.id)}
                    onToggleComplete={() => completeTask(t.id)}
                    onDelete={() => deleteTask(t.id)}
                    motionSetting={settings.motion}
                  />
                ))}
              </div>
            ) : (
              <EmptyState view={activeView} onExampleClick={executeCommandText} />
            )
          ) : visibleTasks.length === 0 ? (
            <EmptyState view={activeView} tag={selectedTag} onExampleClick={executeCommandText} />
          ) : (
            <>
              {/* Overdue */}
              {'overdue' in groupedTasks && groupedTasks.overdue.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-red-500 uppercase tracking-wider px-1">
                    Overdue ({groupedTasks.overdue.length})
                  </div>
                  {groupedTasks.overdue.map((t, idx) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      index={idx}
                      isSelected={selectedTaskId === t.id}
                      onSelect={() => setSelectedTaskId(t.id)}
                      onToggleComplete={() => completeTask(t.id)}
                      onDelete={() => deleteTask(t.id)}
                      motionSetting={settings.motion}
                    />
                  ))}
                </div>
              )}

              {/* Today */}
              {'today' in groupedTasks && groupedTasks.today.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                    Today ({groupedTasks.today.length})
                  </div>
                  {groupedTasks.today.map((t, idx) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      index={idx}
                      isSelected={selectedTaskId === t.id}
                      onSelect={() => setSelectedTaskId(t.id)}
                      onToggleComplete={() => completeTask(t.id)}
                      onDelete={() => deleteTask(t.id)}
                      motionSetting={settings.motion}
                    />
                  ))}
                </div>
              )}

              {/* Tomorrow */}
              {'tomorrow' in groupedTasks && groupedTasks.tomorrow.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                    Tomorrow ({groupedTasks.tomorrow.length})
                  </div>
                  {groupedTasks.tomorrow.map((t, idx) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      index={idx}
                      isSelected={selectedTaskId === t.id}
                      onSelect={() => setSelectedTaskId(t.id)}
                      onToggleComplete={() => completeTask(t.id)}
                      onDelete={() => deleteTask(t.id)}
                      motionSetting={settings.motion}
                    />
                  ))}
                </div>
              )}

              {/* Later */}
              {'later' in groupedTasks && groupedTasks.later.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                    Upcoming ({groupedTasks.later.length})
                  </div>
                  {groupedTasks.later.map((t, idx) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      index={idx}
                      isSelected={selectedTaskId === t.id}
                      onSelect={() => setSelectedTaskId(t.id)}
                      onToggleComplete={() => completeTask(t.id)}
                      onDelete={() => deleteTask(t.id)}
                      motionSetting={settings.motion}
                    />
                  ))}
                </div>
              )}

              {/* No Date */}
              {'noDate' in groupedTasks && groupedTasks.noDate.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                    No Date ({groupedTasks.noDate.length})
                  </div>
                  {groupedTasks.noDate.map((t, idx) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      index={idx}
                      isSelected={selectedTaskId === t.id}
                      onSelect={() => setSelectedTaskId(t.id)}
                      onToggleComplete={() => completeTask(t.id)}
                      onDelete={() => deleteTask(t.id)}
                      motionSetting={settings.motion}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Hero Mic Orb at Bottom Center */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
          {/* Subtle hotkey pill */}
          <div className="px-3 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] shadow-md text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 select-none backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Tap mic or press <kbd className="font-mono font-semibold px-1 py-0.2 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300">Space</kbd> to talk</span>
          </div>

          <MicOrb
            state={speechState}
            audioVolume={audioVolume}
            onClick={toggleListening}
            motionSetting={settings.motion}
            isSupported={isSupported}
          />
        </div>
      </main>

      {/* Right Detail Panel */}
      {selectedTask && (
        <DetailPanel
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onToggleComplete={completeTask}
        />
      )}

      {/* Modals & Dialogs */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <DisambiguationSheet data={disambiguationModal} onClose={() => setDisambiguation(null)} />
      <ConfirmationDialog data={confirmDialog} onClose={() => setConfirmDialog(null)} />
      <SettingsDialog />
      <ShortcutsModal />
      <OnboardingCard />
    </div>
  );
}
