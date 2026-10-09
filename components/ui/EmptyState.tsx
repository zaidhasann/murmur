'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, CheckCircle, Inbox, Calendar } from 'lucide-react';
import { ViewFilter } from '@/lib/types';

interface EmptyStateProps {
  view: ViewFilter;
  tag?: string | null;
  onExampleClick?: (example: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ view, tag, onExampleClick }) => {
  const getContent = () => {
    switch (view) {
      case 'today':
        return {
          title: 'All clear for today',
          description: 'No tasks scheduled for today. Enjoy the calm or add one with your voice.',
          example: 'Add prepare presentation for today',
          icon: <Sun className="w-8 h-8 text-amber-500/80 stroke-[1.2]" />,
        };
      case 'completed':
        return {
          title: 'No completed tasks yet',
          description: 'As you check off tasks, they will gather here as proof of your momentum.',
          example: 'Complete first task',
          icon: <CheckCircle className="w-8 h-8 text-emerald-500/80 stroke-[1.2]" />,
        };
      case 'upcoming':
        return {
          title: 'Horizon looks clear',
          description: 'No upcoming tasks scheduled for tomorrow or later.',
          example: 'Add doctor checkup next Monday at 10am',
          icon: <Calendar className="w-8 h-8 text-blue-500/80 stroke-[1.2]" />,
        };
      case 'tag':
        return {
          title: `No tasks tagged #${tag || ''}`,
          description: `Tag tasks by saying "tag ${tag || 'work'}" or adding #${tag || 'work'}.`,
          example: `Add sync sprint deliverables tag ${tag || 'work'}`,
          icon: <Inbox className="w-8 h-8 text-neutral-400 stroke-[1.2]" />,
        };
      case 'inbox':
      default:
        return {
          title: 'Your inbox is clear',
          description: 'Capture what’s on your mind. Speak naturally or type in the command bar.',
          example: 'Add buy dark roast espresso beans tomorrow',
          icon: <Inbox className="w-8 h-8 text-blue-500/80 stroke-[1.2]" />,
        };
    }
  };

  const content = getContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
        {content.icon}
      </div>

      <h3 className="text-base font-medium text-[var(--text-primary)] mb-1">
        {content.title}
      </h3>
      <p className="text-xs text-neutral-500 max-w-sm mb-4 leading-relaxed">
        {content.description}
      </p>

      {content.example && (
        <button
          type="button"
          onClick={() => onExampleClick?.(content.example)}
          className="text-xs font-mono text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 bg-[var(--bg-subtle)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] transition-colors"
        >
          Try: “{content.example}”
        </button>
      )}
    </motion.div>
  );
};
