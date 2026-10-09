import { ParsedCommand, Priority } from './types';
import { parseNaturalDate } from './date';

export function parseCommand(rawInput: string, referenceDate: Date = new Date()): ParsedCommand {
  const cleanInput = rawInput.trim();
  if (!cleanInput) {
    return {
      raw: rawInput,
      action: { type: 'UNKNOWN', raw: rawInput, suggestion: 'Try saying "Add buy coffee tomorrow"' },
      confidence: 0,
    };
  }

  const lower = cleanInput.toLowerCase();

  // 1. Navigation / Filter commands
  if (/^(?:show|go to|view|open)\s+(today|upcoming|inbox|completed)/i.test(lower)) {
    const match = lower.match(/^(?:show|go to|view|open)\s+(today|upcoming|inbox|completed)/i);
    const view = match![1].toLowerCase() as 'today' | 'upcoming' | 'inbox' | 'completed';
    return { raw: rawInput, action: { type: 'NAVIGATE', view }, confidence: 0.95 };
  }
  if (/^(?:show|filter)\s+(?:high|urgent|medium|low)\s+priority/i.test(lower)) {
    const pMatch = lower.match(/\b(high|urgent|medium|low)\b/i);
    const p = (pMatch ? pMatch[1].toLowerCase() : 'high') as Priority;
    return { raw: rawInput, action: { type: 'NAVIGATE', view: 'inbox', priority: p }, confidence: 0.9 };
  }
  if (/^(?:show|filter|open)\s+tag\s+([#a-zA-Z0-9_-]+)/i.test(lower)) {
    const tMatch = lower.match(/\btag\s+([#a-zA-Z0-9_-]+)/i);
    const tag = tMatch ? tMatch[1].replace(/^#/, '') : '';
    return { raw: rawInput, action: { type: 'NAVIGATE', view: 'tag', tag }, confidence: 0.9 };
  }

  // 2. Undo
  if (/^undo\b/i.test(lower)) {
    return { raw: rawInput, action: { type: 'UNDO' }, confidence: 1 };
  }

  // 3. Read tasks / What's due
  if (/^read\s+(?:my\s+)?tasks\b/i.test(lower) || /^what(?:'s|\s+is)\s+due\s+today\b/i.test(lower)) {
    const scope = /today/i.test(lower) ? 'today' : 'all';
    return { raw: rawInput, action: { type: 'READ_TASKS', scope }, confidence: 0.95 };
  }

  // 4. Clear completed tasks / Delete all completed
  if (
    /(?:delete|remove|clear)\s+(?:all\s+)?completed(?:\s+tasks)?/i.test(lower) ||
    /clear\s+completed/i.test(lower)
  ) {
    return { raw: rawInput, action: { type: 'CLEAR_COMPLETED' }, confidence: 0.98 };
  }

  // 5. Complete / Done
  // e.g. "Mark buy milk as done", "Complete buy milk", "Done buy milk", "Complete the first task"
  if (/^(?:mark\s+)?(.+?)\s+as\s+(?:done|completed|finished)\b/i.test(lower)) {
    const match = cleanInput.match(/^(?:mark\s+)?(.+?)\s+as\s+(?:done|completed|finished)\b/i);
    let target = match ? match[1].trim() : '';
    const index = parseOrdinal(target);
    return {
      raw: rawInput,
      action: { type: 'COMPLETE', targetQuery: target, index: index ?? undefined },
      confidence: 0.95,
    };
  }
  if (/^(?:complete|finish|check\s+off)\s+(.+)/i.test(lower)) {
    const match = cleanInput.match(/^(?:complete|finish|check\s+off)\s+(.+)/i);
    let target = match ? match[1].trim() : '';
    const index = parseOrdinal(target);
    return {
      raw: rawInput,
      action: { type: 'COMPLETE', targetQuery: target, index: index ?? undefined },
      confidence: 0.92,
    };
  }

  // 6. Delete
  // e.g. "Delete call mom", "Remove call mom", "Delete the second task"
  if (/^(?:delete|remove)\s+(.+)/i.test(lower)) {
    const match = cleanInput.match(/^(?:delete|remove)\s+(.+)/i);
    let target = match ? match[1].trim() : '';
    const index = parseOrdinal(target);
    return {
      raw: rawInput,
      action: { type: 'DELETE', targetQuery: target, index: index ?? undefined },
      confidence: 0.92,
    };
  }

  // 7. Prioritize
  // e.g. "Make the report high priority", "Set buy milk to urgent priority", "Make report low priority"
  if (/(?:make|set)\s+(.+?)\s+(?:to\s+)?(urgent|high|medium|low|none)(?:\s+priority)?/i.test(lower)) {
    const match = cleanInput.match(/(?:make|set)\s+(.+?)\s+(?:to\s+)?(urgent|high|medium|low|none)(?:\s+priority)?/i);
    if (match) {
      const target = match[1].trim();
      const priority = match[2].toLowerCase() as Priority;
      const index = parseOrdinal(target);
      return {
        raw: rawInput,
        action: { type: 'PRIORITIZE', targetQuery: target, priority, index: index ?? undefined },
        confidence: 0.94,
      };
    }
  }

  // 8. Edit / Rename / Move
  // e.g. "Rename buy milk to buy oat milk"
  if (/^rename\s+(.+?)\s+to\s+(.+)/i.test(lower)) {
    const match = cleanInput.match(/^rename\s+(.+?)\s+to\s+(.+)/i);
    if (match) {
      return {
        raw: rawInput,
        action: { type: 'EDIT', targetQuery: match[1].trim(), newTitle: match[2].trim() },
        confidence: 0.95,
      };
    }
  }
  // e.g. "Move report to Monday"
  if (/^move\s+(.+?)\s+to\s+(.+)/i.test(lower)) {
    const match = cleanInput.match(/^move\s+(.+?)\s+to\s+(.+)/i);
    if (match) {
      const { date } = parseNaturalDate(match[2].trim(), referenceDate);
      return {
        raw: rawInput,
        action: { type: 'EDIT', targetQuery: match[1].trim(), newDueAt: date ?? undefined },
        confidence: 0.9,
      };
    }
  }

  // 9. Add Task / Remind me to
  // e.g. "Add buy milk tomorrow at 5pm", "Remind me to call mom on Friday", "New task finish report, high priority, tag work"
  let addPayload = cleanInput;
  if (/^(?:add\s+task|add|remind\s+me\s+to|new\s+task|create\s+task|remember\s+to)\s+/i.test(cleanInput)) {
    addPayload = cleanInput.replace(/^(?:add\s+task|add|remind\s+me\s+to|new\s+task|create\s+task|remember\s+to)\s+/i, '').trim();
  }

  // Extract tags (e.g. #work or "tag work" or "tagged work")
  const tags: string[] = [];
  const hashTags = addPayload.match(/#([a-zA-Z0-9_-]+)/g);
  if (hashTags) {
    hashTags.forEach(t => tags.push(t.replace('#', '')));
    addPayload = addPayload.replace(/#[a-zA-Z0-9_-]+/g, '').trim();
  }
  const tagKeywordMatch = addPayload.match(/\b(?:tag|tagged)\s+([a-zA-Z0-9_-]+)\b/i);
  if (tagKeywordMatch) {
    tags.push(tagKeywordMatch[1]);
    addPayload = addPayload.replace(tagKeywordMatch[0], '').trim();
  }

  // Extract priority (e.g. "high priority", "urgent priority", "priority high")
  let priority: Priority = 'none';
  const priorityMatch = addPayload.match(/\b(?:priority\s+(urgent|high|medium|low)|(urgent|high|medium|low)\s+priority)\b/i);
  if (priorityMatch) {
    const matchedP = (priorityMatch[1] || priorityMatch[2]).toLowerCase();
    priority = matchedP as Priority;
    addPayload = addPayload.replace(priorityMatch[0], '').trim();
  }

  // Extract Date & Time
  const { date: dueAt, remainingText } = parseNaturalDate(addPayload, referenceDate);

  // Clean title punctuation
  const title = remainingText.replace(/^[,.\s-]+|[,.\s-]+$/g, '').trim();

  if (title.length > 0) {
    return {
      raw: rawInput,
      action: {
        type: 'ADD',
        title: title.charAt(0).toUpperCase() + title.slice(1),
        dueAt,
        priority,
        tags: Array.from(new Set(tags)),
      },
      confidence: 0.88,
    };
  }

  return {
    raw: rawInput,
    action: {
      type: 'UNKNOWN',
      raw: rawInput,
      suggestion: 'Try saying "Add buy milk tomorrow at 5pm" or "Mark task done"',
    },
    confidence: 0.1,
  };
}

function parseOrdinal(str: string): number | null {
  const match = str.match(/\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|#?1|#?2|#?3)\b/i);
  if (!match) return null;
  const word = match[1].toLowerCase();
  switch (word) {
    case 'first':
    case '1st':
    case '1':
    case '#1':
      return 1;
    case 'second':
    case '2nd':
    case '2':
    case '#2':
      return 2;
    case 'third':
    case '3rd':
    case '3':
    case '#3':
      return 3;
    case 'fourth':
    case '4th':
    case '4':
    case '#4':
      return 4;
    case 'fifth':
    case '5th':
    case '5':
    case '#5':
      return 5;
    default:
      return null;
  }
}

/**
 * Fuzzy score between search query and target task title
 */
export function fuzzyMatchScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (t === q) return 1.0;
  if (t.includes(q)) return 0.8 + (q.length / t.length) * 0.19;

  // Word token overlap
  const qWords = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/\s+/).filter(Boolean);
  let matches = 0;
  for (const qw of qWords) {
    if (tWords.some(tw => tw.includes(qw) || qw.includes(tw))) {
      matches++;
    }
  }

  if (qWords.length > 0 && matches > 0) {
    return (matches / qWords.length) * 0.75;
  }

  return 0;
}
