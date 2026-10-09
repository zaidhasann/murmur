import { describe, it, expect } from 'vitest';
import { parseCommand, fuzzyMatchScore } from '../lib/parser';

describe('Murmur Voice Command Parser', () => {
  const refDate = new Date('2026-10-10T10:00:00.000Z');

  // --- ADD COMMANDS ---
  describe('ADD command parsing', () => {
    it('1. parses simple task addition', () => {
      const res = parseCommand('buy milk', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.title.toLowerCase()).toBe('buy milk');
      }
    });

    it('2. parses "Add buy milk tomorrow at 5pm"', () => {
      const res = parseCommand('Add buy milk tomorrow at 5pm', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.title.toLowerCase()).toContain('buy milk');
        expect(res.action.dueAt).toBeTruthy();
      }
    });

    it('3. parses "Remind me to call mom on Friday"', () => {
      const res = parseCommand('Remind me to call mom on Friday', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.title.toLowerCase()).toContain('call mom');
        expect(res.action.dueAt).toBeTruthy();
      }
    });

    it('4. parses "New task finish report, high priority, tag work"', () => {
      const res = parseCommand('New task finish report, high priority, tag work', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.title.toLowerCase()).toContain('finish report');
        expect(res.action.priority).toBe('high');
        expect(res.action.tags).toContain('work');
      }
    });

    it('5. parses hashtag #design #urgent in task', () => {
      const res = parseCommand('Review wireframes #design #urgent', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.tags).toContain('design');
        expect(res.action.tags).toContain('urgent');
      }
    });

    it('6. parses relative time "in 2 hours"', () => {
      const res = parseCommand('Take medicine in 2 hours', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.dueAt).toBeTruthy();
      }
    });

    it('7. parses "Remember to submit tax form urgent priority"', () => {
      const res = parseCommand('Remember to submit tax form urgent priority', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.priority).toBe('urgent');
      }
    });

    it('8. parses low priority task', () => {
      const res = parseCommand('Water the plants low priority', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.priority).toBe('low');
      }
    });

    it('9. parses medium priority task', () => {
      const res = parseCommand('Add grocery shopping medium priority', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.priority).toBe('medium');
      }
    });

    it('10. parses "Create task draft newsletter for tomorrow"', () => {
      const res = parseCommand('Create task draft newsletter for tomorrow', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.title.toLowerCase()).toContain('draft newsletter');
      }
    });
  });

  // --- COMPLETE COMMANDS ---
  describe('COMPLETE command parsing', () => {
    it('11. parses "Mark buy milk as done"', () => {
      const res = parseCommand('Mark buy milk as done');
      expect(res.action.type).toBe('COMPLETE');
      if (res.action.type === 'COMPLETE') {
        expect(res.action.targetQuery.toLowerCase()).toBe('buy milk');
      }
    });

    it('12. parses "Complete the first task"', () => {
      const res = parseCommand('Complete the first task');
      expect(res.action.type).toBe('COMPLETE');
      if (res.action.type === 'COMPLETE') {
        expect(res.action.index).toBe(1);
      }
    });

    it('13. parses "Mark task 2 as completed"', () => {
      const res = parseCommand('Mark task 2 as completed');
      expect(res.action.type).toBe('COMPLETE');
      if (res.action.type === 'COMPLETE') {
        expect(res.action.index).toBe(2);
      }
    });

    it('14. parses "Finish quarterly review"', () => {
      const res = parseCommand('Finish quarterly review');
      expect(res.action.type).toBe('COMPLETE');
      if (res.action.type === 'COMPLETE') {
        expect(res.action.targetQuery).toBe('quarterly review');
      }
    });

    it('15. parses "Check off buy groceries"', () => {
      const res = parseCommand('Check off buy groceries');
      expect(res.action.type).toBe('COMPLETE');
    });

    it('16. parses "Complete 3rd task"', () => {
      const res = parseCommand('Complete 3rd task');
      expect(res.action.type).toBe('COMPLETE');
      if (res.action.type === 'COMPLETE') {
        expect(res.action.index).toBe(3);
      }
    });
  });

  // --- DELETE COMMANDS ---
  describe('DELETE command parsing', () => {
    it('17. parses "Delete call mom"', () => {
      const res = parseCommand('Delete call mom');
      expect(res.action.type).toBe('DELETE');
      if (res.action.type === 'DELETE') {
        expect(res.action.targetQuery).toBe('call mom');
      }
    });

    it('18. parses "Remove the second task"', () => {
      const res = parseCommand('Remove the second task');
      expect(res.action.type).toBe('DELETE');
      if (res.action.type === 'DELETE') {
        expect(res.action.index).toBe(2);
      }
    });

    it('19. parses "Remove all completed tasks"', () => {
      const res = parseCommand('Remove all completed tasks');
      expect(res.action.type).toBe('CLEAR_COMPLETED');
    });

    it('20. parses "Delete completed"', () => {
      const res = parseCommand('Delete completed');
      expect(res.action.type).toBe('CLEAR_COMPLETED');
    });

    it('21. parses "Clear completed tasks"', () => {
      const res = parseCommand('Clear completed tasks');
      expect(res.action.type).toBe('CLEAR_COMPLETED');
    });
  });

  // --- EDIT / RENAME / MOVE COMMANDS ---
  describe('EDIT command parsing', () => {
    it('22. parses "Rename buy milk to buy oat milk"', () => {
      const res = parseCommand('Rename buy milk to buy oat milk');
      expect(res.action.type).toBe('EDIT');
      if (res.action.type === 'EDIT') {
        expect(res.action.targetQuery).toBe('buy milk');
        expect(res.action.newTitle).toBe('buy oat milk');
      }
    });

    it('23. parses "Move report to Monday"', () => {
      const res = parseCommand('Move report to Monday', refDate);
      expect(res.action.type).toBe('EDIT');
      if (res.action.type === 'EDIT') {
        expect(res.action.targetQuery).toBe('report');
        expect(res.action.newDueAt).toBeTruthy();
      }
    });

    it('24. parses "Move task to tomorrow"', () => {
      const res = parseCommand('Move task to tomorrow', refDate);
      expect(res.action.type).toBe('EDIT');
      if (res.action.type === 'EDIT') {
        expect(res.action.newDueAt).toBeTruthy();
      }
    });
  });

  // --- PRIORITIZE COMMANDS ---
  describe('PRIORITIZE command parsing', () => {
    it('25. parses "Make the report high priority"', () => {
      const res = parseCommand('Make the report high priority');
      expect(res.action.type).toBe('PRIORITIZE');
      if (res.action.type === 'PRIORITIZE') {
        expect(res.action.targetQuery).toBe('the report');
        expect(res.action.priority).toBe('high');
      }
    });

    it('26. parses "Set finish taxes to urgent priority"', () => {
      const res = parseCommand('Set finish taxes to urgent priority');
      expect(res.action.type).toBe('PRIORITIZE');
      if (res.action.type === 'PRIORITIZE') {
        expect(res.action.targetQuery).toBe('finish taxes');
        expect(res.action.priority).toBe('urgent');
      }
    });

    it('27. parses "Make the first task low priority"', () => {
      const res = parseCommand('Make the first task low priority');
      expect(res.action.type).toBe('PRIORITIZE');
      if (res.action.type === 'PRIORITIZE') {
        expect(res.action.index).toBe(1);
        expect(res.action.priority).toBe('low');
      }
    });
  });

  // --- FILTER & NAVIGATION COMMANDS ---
  describe('NAVIGATE command parsing', () => {
    it('28. parses "Show today"', () => {
      const res = parseCommand('Show today');
      expect(res.action.type).toBe('NAVIGATE');
      if (res.action.type === 'NAVIGATE') {
        expect(res.action.view).toBe('today');
      }
    });

    it('29. parses "Show high priority"', () => {
      const res = parseCommand('Show high priority');
      expect(res.action.type).toBe('NAVIGATE');
      if (res.action.type === 'NAVIGATE') {
        expect(res.action.priority).toBe('high');
      }
    });

    it('30. parses "Show completed"', () => {
      const res = parseCommand('Show completed');
      expect(res.action.type).toBe('NAVIGATE');
      if (res.action.type === 'NAVIGATE') {
        expect(res.action.view).toBe('completed');
      }
    });

    it('31. parses "Go to upcoming"', () => {
      const res = parseCommand('Go to upcoming');
      expect(res.action.type).toBe('NAVIGATE');
      if (res.action.type === 'NAVIGATE') {
        expect(res.action.view).toBe('upcoming');
      }
    });

    it('32. parses "Open inbox"', () => {
      const res = parseCommand('Open inbox');
      expect(res.action.type).toBe('NAVIGATE');
      if (res.action.type === 'NAVIGATE') {
        expect(res.action.view).toBe('inbox');
      }
    });

    it('33. parses "Show tag work"', () => {
      const res = parseCommand('Show tag work');
      expect(res.action.type).toBe('NAVIGATE');
      if (res.action.type === 'NAVIGATE') {
        expect(res.action.view).toBe('tag');
        expect(res.action.tag).toBe('work');
      }
    });
  });

  // --- UTILITY COMMANDS ---
  describe('Utility & edge commands', () => {
    it('34. parses "Undo"', () => {
      const res = parseCommand('Undo');
      expect(res.action.type).toBe('UNDO');
    });

    it('35. parses "Read my tasks"', () => {
      const res = parseCommand('Read my tasks');
      expect(res.action.type).toBe('READ_TASKS');
    });

    it('36. parses "What\'s due today?"', () => {
      const res = parseCommand("What's due today?");
      expect(res.action.type).toBe('READ_TASKS');
      if (res.action.type === 'READ_TASKS') {
        expect(res.action.scope).toBe('today');
      }
    });

    it('37. handles empty string gracefully', () => {
      const res = parseCommand('');
      expect(res.action.type).toBe('UNKNOWN');
    });

    it('38. handles messy casing and spacing', () => {
      const res = parseCommand('   adD   BUY   MILK  today at 4pm   ', refDate);
      expect(res.action.type).toBe('ADD');
      if (res.action.type === 'ADD') {
        expect(res.action.title.toLowerCase()).toContain('buy milk');
        expect(res.action.dueAt).toBeTruthy();
      }
    });

    it('39. handles fuzzy match scoring exact and partial', () => {
      expect(fuzzyMatchScore('buy milk', 'Buy Milk')).toBe(1.0);
      expect(fuzzyMatchScore('milk', 'Buy organic milk')).toBeGreaterThan(0.7);
      expect(fuzzyMatchScore('gym', 'Call mom')).toBe(0);
    });

    it('40. handles ambiguous ordinal target', () => {
      const res = parseCommand('Delete 4th task');
      expect(res.action.type).toBe('DELETE');
      if (res.action.type === 'DELETE') {
        expect(res.action.index).toBe(4);
      }
    });
  });
});
