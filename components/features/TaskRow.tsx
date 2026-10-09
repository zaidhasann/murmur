'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flag, Tag, Trash2, Check, Clock } from 'lucide-react';
import { Task } from '@/lib/types';
import { formatDueDate } from '@/lib/date';

interface TaskRowProps {
  task: Task;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  motionSetting?: 'full' | 'reduced' | 'off';
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  index,
  isSelected,
  onSelect,
  onToggleComplete,
  onDelete,
  motionSetting = 'full',
}) => {
  const isCompleted = task.status === 'completed';
  const dueInfo = task.dueAt ? formatDueDate(task.dueAt) : null;

  return (
    <motion.div
      layout={motionSetting !== 'off'}
      initial={motionSetting === 'off' ? {} : { opacity: 0, y: 10 }}
      animate={motionSetting === 'off' ? {} : { opacity: 1, y: 0 }}
      exit={
        motionSetting === 'off'
          ? {}
          : {
              opacity: 0,
              scale: 0.95,
              rotate: -2,
              height: 0,
              marginBottom: 0,
              transition: { duration: 0.24 },
            }
      }
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={`group relative flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/50 shadow-sm'
          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Custom Circular Animated Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          aria-label={isCompleted ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}
          className="relative w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center shrink-0 hover:border-blue-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          {isCompleted && (
            <motion.div
              initial={motionSetting === 'off' ? {} : { scale: 0 }}
              animate={motionSetting === 'off' ? {} : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center"
            >
              <Check className="w-3 h-3 text-white stroke-[2.5]" />
            </motion.div>
          )}
        </button>

        {/* Task Title & Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="relative inline-block overflow-hidden text-ellipsis whitespace-nowrap">
            <span
              className={`text-sm tracking-tight transition-colors ${
                isCompleted
                  ? 'text-neutral-400 dark:text-neutral-500 line-through'
                  : 'text-[var(--text-primary)] font-normal'
              }`}
            >
              {task.title}
            </span>
          </div>

          {/* Chips line */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {dueInfo && dueInfo.label && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium tracking-tight ${
                  dueInfo.isOverdue
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                    : dueInfo.isToday
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Calendar className="w-2.5 h-2.5 stroke-[1.5]" />
                {dueInfo.label}
              </span>
            )}

            {task.priority !== 'none' && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider text-[10px] ${
                  task.priority === 'urgent'
                    ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                    : task.priority === 'high'
                    ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                    : task.priority === 'medium'
                    ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Flag className="w-2.5 h-2.5 stroke-[1.5]" />
                {task.priority}
              </span>
            )}

            {task.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800"
              >
                <Tag className="w-2.5 h-2.5 stroke-[1.5] text-neutral-400" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-2 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${task.title}`}
          className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
        </button>
      </div>
    </motion.div>
  );
};
