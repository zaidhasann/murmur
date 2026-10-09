import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Murmur — Voice-First Task Manager',
  version: '1.0.0',
  description: 'Voice-controlled task manager with floating orb bubble and side panel.',
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_title: 'Murmur Tasks',
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.tsx'],
      all_frames: false,
      run_at: 'document_idle',
    },
  ],
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  permissions: ['storage', 'alarms', 'notifications', 'sidePanel'],
  commands: {
    'toggle-widget': {
      suggested_key: {
        default: 'Ctrl+Shift+Space',
        mac: 'Command+Shift+Space',
      },
      description: 'Toggle Murmur floating widget & voice',
    },
    'open-side-panel': {
      description: 'Open Murmur Side Panel',
    },
  },
  web_accessible_resources: [
    {
      resources: ['src/voice/voice.html', 'src/permission/permission.html', 'assets/*'],
      matches: ['<all_urls>'],
    },
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';",
  },
});
