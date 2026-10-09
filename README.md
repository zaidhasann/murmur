# Murmur — Voice-First Task Manager

> **Speaking is the fastest way to capture a task.**  
> Murmur blends the precision of Linear, the restraint of Things 3, and the effortless quick-capture of Apple Reminders into an intentional, voice-first productivity workspace.

---

## 1. Quick Start & Setup

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm 9+

### Installation & Launch
```bash
# Clone or navigate to the directory
cd d:/murmur

# Install dependencies (already completed)
npm install

# Run unit tests (40 comprehensive parser tests)
npx vitest run

# Run production build
npm run build

# Start local server
npm run dev
# or: npm run start
```

Open [http://localhost:3000](http://localhost:3000) in any modern browser (Chrome, Edge, Safari, or Arc recommended for Web Speech API microphone access).

---

## 2. Supported Voice & Text Commands

Murmur parses commands directly on-device using a pure, unit-tested natural language processing pipeline (`/lib/parser.ts`). You can speak into the **Mic Orb** or type into the **Command Bar** (`⌘K` / `Ctrl+K`).

| Intent | Natural Voice Examples | Outcome |
| :--- | :--- | :--- |
| **Add** | `"Add buy oat milk tomorrow at 5pm"`<br/>`"Remind me to call mom on Friday"`<br/>`"New task finish report, high priority, tag work"`<br/>`"Review wireframes #design #urgent"`<br/>`"Take medicine in 2 hours"` | Extracts title, scheduled ISO date/time, priority level, and tags. Creates new task with instant tactile feedback. |
| **Complete** | `"Mark buy oat milk as done"`<br/>`"Complete the first task"`<br/>`"Finish quarterly review"`<br/>`"Check off buy groceries"` | Fuzzy-matches existing task title or positional index. Animates completion with circle draw and chime. |
| **Delete** | `"Delete call mom"`<br/>`"Remove the second task"`<br/>`"Delete all completed tasks"` | Deletes target task or opens confirmation modal for bulk removal. |
| **Edit / Move** | `"Rename buy milk to buy oat milk"`<br/>`"Move report to Monday"`<br/>`"Move task to tomorrow"` | Modifies title or reschedules due dates dynamically. |
| **Prioritize** | `"Make the report high priority"`<br/>`"Set finish taxes to urgent priority"`<br/>`"Make the first task low priority"` | Updates priority token (`none`, `low`, `medium`, `high`, `urgent`). |
| **Filter / Navigate** | `"Show today"`<br/>`"Show high priority"`<br/>`"Show completed"`<br/>`"Go to upcoming"`<br/>`"Show tag work"` | Seamlessly switches active workspace views with spring transitions. |
| **Utility** | `"Undo"`<br/>`"Read my tasks"`<br/>`"What's due today?"` | Reverts prior state from history stack or speaks audio summaries. |

---

## 3. Browser Support & Graceful Degradation

- **Google Chrome, Chromium, Microsoft Edge, Safari**: Full support for both `webkitSpeechRecognition` (voice capture) and `speechSynthesis` (spoken feedback) plus Web Audio `AnalyserNode` 60fps volume visualization.
- **Firefox & Unsupported Browsers**: Firefox currently does not expose the SpeechRecognition engine. Murmur detects this at mount time, renders a friendly status banner with zero console errors, and seamlessly guides the user to use the **Pill Command Bar** which accepts all 40+ natural voice commands verbatim.
- **Microphone Permissions**: Explicit error state handling for `not-allowed`, `no-speech`, and `network` with human-first recovery tips.

---

## 4. Design Rationale & Product Architecture

### Restrained Neutral Scale & Confident Accent
Murmur rejects noisy rainbow gradients, heavy glassmorphism, and neon glow. It relies on a 11-step warm neutral palette (`#fbfbfa` base up to `#10100f`) paired with a deep, confident ink-blue (`#2563eb` / `#1e40af`). This directs total cognitive focus to the user's tasks. In dark mode, harsh pure black is replaced with warm carbon tones (`#121211`) and subtle surface elevation (`#1a1a18`).

### Intentional Motion & Physics
Animation in Murmur is communicative, never decorative:
- **Hero Mic Orb**: Renders a live 2D canvas organic blob whose vertices deform dynamically in response to microphone sound pressure through a Web Audio `AnalyserNode`.
- **Micro-interactions**: Circle stroke drawing on complete (220ms ease-out), animated strike-through line, and smooth spring physics (stiffness 350, damping 30) across layout changes.
- **Respect for Preferences**: Includes an accessible Motion toggle (`Full`, `Reduced`, `Off`) that defaults to system `prefers-reduced-motion`.

### Accessibility & Privacy First
- 100% WCAG AA contrast compliance across all text/background pairs.
- Full keyboard navigation (`Space` to talk, `⌘K` to focus bar, `?` for cheat sheet, `Esc` to close overlays).
- **Zero Cloud Dependence**: All voice parsing, storage, and audio analysis happen strictly on the user's machine via localStorage and Web APIs.
