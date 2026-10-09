import { Task } from '@/lib/types';

const STORAGE_KEY = 'murmur_tasks_v1';
const SETTINGS_KEY = 'murmur_settings_v1';

// Update action toolbar badge with today's open task count
async function updateBadge() {
  try {
    const res = await chrome.storage.local.get([STORAGE_KEY]);
    const tasks: Task[] = res[STORAGE_KEY] || [];
    const openCount = tasks.filter((t) => t.status === 'todo').length;

    if (openCount > 0) {
      await chrome.action.setBadgeText({ text: String(openCount) });
      await chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    console.error('Error updating badge:', err);
  }
}

// Reschedule alarms based on tasks dueAt
async function syncAlarms() {
  try {
    await chrome.alarms.clearAll();
    const res = await chrome.storage.local.get([STORAGE_KEY]);
    const tasks: Task[] = res[STORAGE_KEY] || [];

    const now = Date.now();
    for (const task of tasks) {
      if (task.status === 'todo' && task.dueAt) {
        const dueTime = new Date(task.dueAt).getTime();
        if (dueTime > now) {
          await chrome.alarms.create(`task_due_${task.id}`, {
            when: dueTime,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error syncing alarms:', err);
  }
}

// On install, open permission tab to request mic
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/permission/permission.html'),
    });
  }
  updateBadge();
  syncAlarms();
});

// Click toolbar action to toggle sidePanel
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id && chrome.sidePanel) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Keyboard commands handler
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'toggle-widget' && tab?.id) {
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_WIDGET' }).catch(() => {
      // If content script cannot run (e.g. chrome:// page), open side panel
      if (chrome.sidePanel && tab.id) {
        chrome.sidePanel.open({ tabId: tab.id });
      }
    });
  } else if (command === 'open-side-panel' && tab?.id) {
    if (chrome.sidePanel) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  }
});

// Listen to alarms for task reminders
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('task_due_')) {
    const taskId = alarm.name.replace('task_due_', '');
    const res = await chrome.storage.local.get([STORAGE_KEY]);
    const tasks: Task[] = res[STORAGE_KEY] || [];
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status === 'todo') {
      chrome.notifications.create(alarm.name, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Murmur Reminder',
        message: task.title,
        buttons: [{ title: 'Mark Done' }, { title: 'Snooze 10m' }],
        priority: 2,
      });
    }
  }
});

// Notification button click handler
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId.startsWith('task_due_')) {
    const taskId = notificationId.replace('task_due_', '');
    const res = await chrome.storage.local.get([STORAGE_KEY]);
    const tasks: Task[] = res[STORAGE_KEY] || [];

    if (buttonIndex === 0) {
      // Mark Done
      const updated = tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
      );
      await chrome.storage.local.set({ [STORAGE_KEY]: updated });
      chrome.notifications.clear(notificationId);
    } else if (buttonIndex === 1) {
      // Snooze 10 mins
      await chrome.alarms.create(notificationId, {
        when: Date.now() + 10 * 60 * 1000,
      });
      chrome.notifications.clear(notificationId);
    }
  }
});

// Storage changes sync badge and alarms
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) {
    updateBadge();
    syncAlarms();
  }
});
