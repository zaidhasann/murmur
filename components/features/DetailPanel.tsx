'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flag, Tag, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { Task, Priority } from '@/lib/types';
import { formatDueDate } from '@/lib/date';

interface DetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
  onToggleComplete,
}) => {
  if (!task) return null;

  const dueInfo = task.dueAt ? formatDueDate(task.dueAt) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[380px] bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] shadow-xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleComplete(task.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors ${
                task.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
              {task.status === 'completed' ? 'Completed' : 'Mark Done'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close detail panel"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* Title Editor */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => onUpdate(task.id, { title: e.target.value })}
              className="w-full text-base font-medium text-[var(--text-primary)] bg-transparent border-b border-[var(--border-subtle)] pb-1 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Notes Area */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              value={task.notes || ''}
              onChange={(e) => onUpdate(task.id, { notes: e.target.value })}
              placeholder="Add notes, links, or context..."
              rows={4}
              className="w-full text-sm text-[var(--text-primary)] bg-[var(--bg-subtle)] p-2.5 rounded-lg border border-[var(--border-subtle)] focus:border-blue-500 focus:outline-none resize-none placeholder-neutral-400"
            />
          </div>

          {/* Due Date & Time Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400 stroke-[1.5]" />
              <input
                type="datetime-local"
                value={task.dueAt ? task.dueAt.slice(0, 16) : ''}
                onChange={(e) => {
                  const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                  onUpdate(task.id, { dueAt: val });
                }}
                className="text-xs bg-[var(--bg-subtle)] text-[var(--text-primary)] p-2 rounded-md border border-[var(--border-subtle)] focus:outline-none"
              />
              {task.dueAt && (
                <button
                  onClick={() => onUpdate(task.id, { dueAt: null })}
                  className="text-xs text-neutral-400 hover:text-red-500"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Priority Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {(['none', 'low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onUpdate(task.id, { priority: p })}
                  className={`px-2.5 py-1 text-xs rounded-md capitalize font-medium transition-all ${
                    task.priority === p
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                      : 'bg-[var(--bg-subtle)] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={task.tags.join(', ')}
              onChange={(e) => {
                const arr = e.target.value
                  .split(',')
                  .map((t) => t.trim().replace(/^#/, ''))
                  .filter(Boolean);
                onUpdate(task.id, { tags: arr });
              }}
              placeholder="work, personal, design"
              className="w-full text-xs text-[var(--text-primary)] bg-[var(--bg-subtle)] p-2 rounded-md border border-[var(--border-subtle)] focus:outline-none"
            />
          </div>

          {/* Timestamps */}
          <div className="text-[11px] text-neutral-400 space-y-1 pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 stroke-[1.5]" />
              <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
            {task.completedAt && (
              <div>Completed {new Date(task.completedAt).toLocaleDateString()}</div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <button
            onClick={() => {
              onDelete(task.id);
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
            Delete task
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </AnimatePresence>
  );
};
