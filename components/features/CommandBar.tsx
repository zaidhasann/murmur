'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CornerDownLeft, Calendar, Flag, Tag, ArrowRight, Mic, MicOff } from 'lucide-react';
import { parseCommand } from '@/lib/parser';
import { ParsedCommand } from '@/lib/types';
import { formatDueDate } from '@/lib/date';

interface CommandBarProps {
  interimTranscript: string;
  isListening: boolean;
  onSubmit: (text: string) => void;
  onToggleListening?: () => void;
  isSupported?: boolean;
  motionSetting?: 'full' | 'reduced' | 'off';
}

const ROTATING_EXAMPLES = [
  'Remind me to call mom tomorrow at 6pm',
  'New task finish quarterly roadmap, high priority, tag work',
  'Mark buy espresso beans as done',
  'Add review pitch deck #design #urgent',
  'Move quarterly roadmap to next Monday',
  'Show today',
  'What’s due today?',
];

export const CommandBar: React.FC<CommandBarProps> = ({
  interimTranscript,
  isListening,
  onSubmit,
  onToggleListening,
  isSupported = true,
  motionSetting = 'full',
}) => {
  const [typedInput, setTypedInput] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Rotate placeholder examples every 4 seconds
  useEffect(() => {
    if (isListening || isFocused || typedInput.length > 0) return;
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isListening, isFocused, typedInput]);

  // Global hotkey: Cmd/Ctrl+K or Space when no input is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    onSubmit(typedInput.trim());
    setTypedInput('');
  };

  // Preview parsed command in real-time as user types
  const parsedPreview: ParsedCommand | null = typedInput.trim().length > 3 ? parseCommand(typedInput.trim()) : null;

  return (
    <div className="w-full relative">
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center w-full min-h-[52px] px-4 rounded-xl border transition-all duration-200 bg-[var(--bg-surface)] ${
          isListening
            ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
            : isFocused
            ? 'border-neutral-400 dark:border-neutral-500 shadow-md ring-2 ring-neutral-900/10 dark:ring-neutral-100/10'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
        }`}
      >
        <Sparkles className="w-4 h-4 text-neutral-400 mr-3 shrink-0 stroke-[1.5]" />

        {/* Live Voice Transcript or Text Input */}
        <div className="flex-1 relative flex items-center">
          {isListening ? (
            <div className="py-2 text-sm text-[var(--text-primary)] font-medium flex items-center gap-1.5 overflow-hidden">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping mr-1 shrink-0" />
              {interimTranscript ? (
                <span className="text-[var(--text-primary)]">
                  {interimTranscript}
                  <span className="inline-block w-1 h-3.5 bg-blue-500 ml-1 animate-pulse" />
                </span>
              ) : (
                <span className="text-neutral-400 italic">Listening... speak your task or command</span>
              )}
            </div>
          ) : (
            <div className="w-full relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full py-2 bg-transparent text-sm text-[var(--text-primary)] placeholder-transparent focus:outline-none"
                placeholder={ROTATING_EXAMPLES[exampleIndex]}
              />

              {/* Rotating Animated Placeholder */}
              {!typedInput && !isFocused && (
                <div className="absolute inset-0 pointer-events-none flex items-center text-sm text-neutral-400 select-none overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="mr-1.5 opacity-60">Try:</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={exampleIndex}
                      initial={motionSetting === 'off' ? {} : { opacity: 0, y: 4 }}
                      animate={motionSetting === 'off' ? {} : { opacity: 1, y: 0 }}
                      exit={motionSetting === 'off' ? {} : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.24 }}
                      className="text-neutral-500 dark:text-neutral-400"
                    >
                      “{ROTATING_EXAMPLES[exampleIndex]}”
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enter submit indicator / Voice Mic Button / Hotkey hint */}
        <div className="flex items-center gap-2 pl-2 shrink-0">
          {onToggleListening && (
            <button
              type="button"
              onClick={onToggleListening}
              aria-label={isListening ? 'Stop listening' : 'Start speaking'}
              className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-all text-xs font-medium ${
                isListening
                  ? 'bg-blue-600 text-white animate-pulse shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {isSupported ? (
                <>
                  <Mic className="w-3.5 h-3.5 stroke-[1.8] text-current" />
                  <span className="hidden sm:inline text-[11px] font-medium">{isListening ? 'Listening…' : 'Voice'}</span>
                </>
              ) : (
                <MicOff className="w-3.5 h-3.5 text-neutral-400 stroke-[1.5]" />
              )}
            </button>
          )}

          {typedInput ? (
            <button
              type="submit"
              className="p-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
              aria-label="Submit command"
            >
              <CornerDownLeft className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">
              ⌘K
            </kbd>
          )}
        </div>
      </form>

      {/* Real-time Parsed Preview Chip below input */}
      <AnimatePresence>
        {parsedPreview && parsedPreview.action.type === 'ADD' && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 right-0 top-full mt-1.5 p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] shadow-md z-20 flex flex-wrap items-center gap-2 text-xs"
          >
            <span className="text-neutral-400 uppercase tracking-wider font-semibold text-[10px] flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-blue-500" />
              Will Add:
            </span>
            <span className="font-medium text-[var(--text-primary)]">
              {parsedPreview.action.title}
            </span>

            {parsedPreview.action.dueAt && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                <Calendar className="w-3 h-3 stroke-[1.5]" />
                {formatDueDate(parsedPreview.action.dueAt).label}
              </span>
            )}

            {parsedPreview.action.priority && parsedPreview.action.priority !== 'none' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium capitalize">
                <Flag className="w-3 h-3 stroke-[1.5]" />
                {parsedPreview.action.priority}
              </span>
            )}

            {parsedPreview.action.tags && parsedPreview.action.tags.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                <Tag className="w-3 h-3 stroke-[1.5]" />
                {parsedPreview.action.tags.map((t) => `#${t}`).join(' ')}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
