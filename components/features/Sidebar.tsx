'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, Sun, Calendar, CheckSquare, Tag, Settings, HelpCircle } from 'lucide-react';
import { ViewFilter } from '@/lib/types';

interface SidebarProps {
  activeView: ViewFilter;
  selectedTag: string | null;
  counts: {
    inbox: number;
    today: number;
    upcoming: number;
    completed: number;
  };
  tags: string[];
  onSelectView: (view: ViewFilter, tag?: string) => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  selectedTag,
  counts,
  tags,
  onSelectView,
  onOpenSettings,
  onOpenShortcuts,
}) => {
  const navItems: { id: ViewFilter; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4 stroke-[1.5]" />, count: counts.inbox },
    { id: 'today', label: 'Today', icon: <Sun className="w-4 h-4 stroke-[1.5]" />, count: counts.today },
    { id: 'upcoming', label: 'Upcoming', icon: <Calendar className="w-4 h-4 stroke-[1.5]" />, count: counts.upcoming },
    { id: 'completed', label: 'Completed', icon: <CheckSquare className="w-4 h-4 stroke-[1.5]" />, count: counts.completed },
  ];

  return (
    <aside className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between select-none">
      <div className="space-y-6">
        {/* App Title */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 block" />
            <h1 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
              Murmur
            </h1>
          </div>
          <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            v1.0
          </span>
        </div>

        {/* Primary Views */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id && !selectedTag;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between h-10 px-3 rounded-lg text-sm transition-colors relative ${
                  isActive
                    ? 'text-[var(--text-primary)] font-medium bg-neutral-100 dark:bg-neutral-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className="text-xs tabular-nums text-neutral-400 font-mono">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tags Section */}
        {tags.length > 0 && (
          <div className="space-y-1 pt-2">
            <div className="px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Tags
            </div>
            {tags.map((tag) => {
              const isActive = activeView === 'tag' && selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectView('tag', tag)}
                  className={`w-full flex items-center justify-between h-9 px-3 rounded-lg text-xs transition-colors ${
                    isActive
                      ? 'text-[var(--text-primary)] font-medium bg-neutral-100 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-3 h-3 stroke-[1.5] text-neutral-400" />
                    <span>#{tag}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Settings & Shortcuts */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-1">
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="w-full flex items-center gap-2.5 h-9 px-3 rounded-lg text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <HelpCircle className="w-4 h-4 stroke-[1.5] text-neutral-400" />
          <span>Shortcuts (?)</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 h-9 px-3 rounded-lg text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <Settings className="w-4 h-4 stroke-[1.5] text-neutral-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
