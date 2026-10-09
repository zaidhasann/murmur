import { addDays, nextDay, parse, setHours, setMinutes, format, isAfter, isBefore, isToday, isTomorrow } from 'date-fns';

export function parseNaturalDate(input: string, referenceDate: Date = new Date()): { date: string | null; remainingText: string } {
  let text = input.trim();
  const lower = text.toLowerCase();

  // Pattern: "in X hours" / "in X mins"
  const inHoursMatch = lower.match(/\bin\s+(\d+)\s+hours?\b/i);
  if (inHoursMatch) {
    const hours = parseInt(inHoursMatch[1], 10);
    const target = new Date(referenceDate.getTime() + hours * 60 * 60 * 1000);
    text = text.replace(new RegExp(`\\bin\\s+${hours}\\s+hours?\\b`, 'gi'), '').trim();
    return { date: target.toISOString(), remainingText: text };
  }

  const inMinsMatch = lower.match(/\bin\s+(\d+)\s+(?:mins?|minutes?)\b/i);
  if (inMinsMatch) {
    const mins = parseInt(inMinsMatch[1], 10);
    const target = new Date(referenceDate.getTime() + mins * 60 * 1000);
    text = text.replace(new RegExp(`\\bin\\s+${mins}\\s+(?:mins?|minutes?)\\b`, 'gi'), '').trim();
    return { date: target.toISOString(), remainingText: text };
  }

  // Time extraction helper (e.g. "at 5pm", "at 5:30 pm", "at 17:00")
  let targetTime: { hours: number; minutes: number } | null = null;
  const timeMatch = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3]?.toLowerCase();

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
    targetTime = { hours, minutes };
    text = text.replace(timeMatch[0], '').trim();
  }

  let targetDate: Date | null = null;

  // Tomorrow
  if (/\btomorrow\b/i.test(text)) {
    targetDate = addDays(referenceDate, 1);
    text = text.replace(/\btomorrow\b/gi, '').trim();
  }
  // Today
  else if (/\btoday\b/i.test(text)) {
    targetDate = referenceDate;
    text = text.replace(/\btoday\b/gi, '').trim();
  }
  // Day of week e.g. "on friday", "next monday", "this saturday"
  else {
    const daysOfWeek: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const dayMatch = text.match(/\b(?:on\s+|next\s+|this\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (dayMatch) {
      const dayName = dayMatch[1].toLowerCase();
      const targetDay = daysOfWeek[dayName];
      if (targetDay !== undefined) {
        targetDate = nextDay(referenceDate, targetDay);
        text = text.replace(dayMatch[0], '').trim();
      }
    }
  }

  if (targetDate) {
    if (targetTime) {
      targetDate = setMinutes(setHours(targetDate, targetTime.hours), targetTime.minutes);
      return { date: targetDate.toISOString(), remainingText: cleanText(text) };
    } else {
      // Default time for date only: end of standard work day 18:00
      targetDate = setMinutes(setHours(targetDate, 18), 0);
      return { date: targetDate.toISOString(), remainingText: cleanText(text) };
    }
  }

  if (targetTime) {
    // If only time was provided, if already passed today, schedule tomorrow, else today
    let candidate = setMinutes(setHours(referenceDate, targetTime.hours), targetTime.minutes);
    if (isBefore(candidate, referenceDate)) {
      candidate = addDays(candidate, 1);
    }
    return { date: candidate.toISOString(), remainingText: cleanText(text) };
  }

  return { date: null, remainingText: cleanText(text) };
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[,.\s]+|[,.\s]+$/g, '')
    .trim();
}

export function formatDueDate(dateIso: string | null): { label: string; isOverdue: boolean; isToday: boolean; isTomorrow: boolean } {
  if (!dateIso) return { label: '', isOverdue: false, isToday: false, isTomorrow: false };
  const d = new Date(dateIso);
  const now = new Date();

  const isTod = isToday(d);
  const isTom = isTomorrow(d);
  const isPast = isBefore(d, now) && !isTod;

  let timeStr = format(d, 'h:mm a');
  if (timeStr === '6:00 PM' || timeStr === '11:59 PM') {
    // Show only date if generic
    timeStr = '';
  }

  if (isTod) {
    return { label: timeStr ? `Today, ${timeStr}` : 'Today', isOverdue: false, isToday: true, isTomorrow: false };
  }
  if (isTom) {
    return { label: timeStr ? `Tomorrow, ${timeStr}` : 'Tomorrow', isOverdue: false, isToday: false, isTomorrow: true };
  }

  const dateStr = format(d, 'MMM d');
  return {
    label: timeStr ? `${dateStr}, ${timeStr}` : dateStr,
    isOverdue: isPast,
    isToday: false,
    isTomorrow: false,
  };
}
