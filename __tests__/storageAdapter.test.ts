import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter, StorageAdapter } from '../lib/storageAdapter';
import { Task, UserSettings } from '../lib/types';

// Mock localStorage for node environment in vitest
class MockLocalStorage {
  private store: Record<string, string> = {};

  get length() {
    return Object.keys(this.store).length;
  }
  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
}

describe('StorageAdapter Interface and LocalStorage Implementation', () => {
  let adapter: StorageAdapter;
  const mockStorage = new MockLocalStorage();

  beforeEach(() => {
    mockStorage.clear();
    // @ts-ignore
    global.window = {
      localStorage: mockStorage,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    // @ts-ignore
    global.localStorage = mockStorage;
    adapter = new LocalStorageAdapter();
  });

  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Test Task',
      priority: 'high',
      tags: ['work'],
      status: 'todo',
      dueAt: '2026-10-10T12:00:00Z',
      createdAt: '2026-10-10T10:00:00Z',
      completedAt: null,
    },
  ];

  const sampleSettings: UserSettings = {
    userName: 'Tester',
    voiceFeedback: true,
    soundEffects: false,
    language: 'en-US',
    theme: 'dark',
    motion: 'full',
  };

  it('saves and retrieves tasks correctly', async () => {
    await adapter.setTasks(sampleTasks);
    const retrieved = await adapter.getTasks();
    expect(retrieved).toHaveLength(1);
    expect(retrieved?.[0].title).toBe('Test Task');
  });

  it('saves and retrieves user settings correctly', async () => {
    await adapter.setSettings(sampleSettings);
    const retrieved = await adapter.getSettings();
    expect(retrieved?.userName).toBe('Tester');
    expect(retrieved?.theme).toBe('dark');
  });

  it('returns null when storage is empty', async () => {
    const emptyTasks = await adapter.getTasks();
    expect(emptyTasks).toBeNull();
  });
});
