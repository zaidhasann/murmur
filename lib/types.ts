export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'completed';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  dueAt: string | null; // ISO string or YYYY-MM-DD / YYYY-MM-DDTHH:mm
  priority: Priority;
  tags: string[];
  status: TaskStatus;
  createdAt: string; // ISO string
  completedAt: string | null; // ISO string
  order?: number;
}

export type ViewFilter = 'inbox' | 'today' | 'upcoming' | 'completed' | 'tag';

export type MotionPreference = 'full' | 'reduced' | 'off';

export interface UserSettings {
  userName: string;
  voiceFeedback: boolean;
  soundEffects: boolean;
  language: string; // 'en-US' | 'en-IN' | 'en-GB' | 'hi-IN'
  theme: 'system' | 'light' | 'dark';
  motion: MotionPreference;
}

export type CommandAction =
  | { type: 'ADD'; title: string; dueAt?: string | null; priority?: Priority; tags?: string[]; notes?: string }
  | { type: 'COMPLETE'; targetQuery: string; index?: number }
  | { type: 'DELETE'; targetQuery: string; index?: number; isAllCompleted?: boolean }
  | { type: 'EDIT'; targetQuery: string; newTitle?: string; newDueAt?: string; index?: number }
  | { type: 'PRIORITIZE'; targetQuery: string; priority: Priority; index?: number }
  | { type: 'NAVIGATE'; view: ViewFilter; tag?: string; priority?: Priority }
  | { type: 'UNDO' }
  | { type: 'READ_TASKS'; scope?: 'today' | 'all' | 'high' }
  | { type: 'CLEAR_COMPLETED' }
  | { type: 'UNKNOWN'; raw: string; suggestion?: string };

export interface ParsedCommand {
  raw: string;
  action: CommandAction;
  confidence: number;
}
