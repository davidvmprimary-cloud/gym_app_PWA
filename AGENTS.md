# AGENTS.md — GymTracker Project Guide

This file governs the behavior of every agent (Claude Code, Cursor, Copilot, or any other)
working on this project. Read it entirely before writing a single line of code.
Non-compliance with these rules is worse than not helping at all.

---

## 1. Project Overview

**GymTracker** is a Progressive Web App (PWA) for personal gym session tracking.
It is built to work **primarily offline**, be installable on iPhone and Android,
and be deployable as a static site on Vercel.

### Core stack
| Layer | Technology | Reason |
|---|---|---|
| Framework | Vite + React (JavaScript, not TypeScript) | Simple, fast, static output |
| Styling | CSS Modules | No build complexity, scoped styles |
| Local database | Dexie.js v3 (IndexedDB) | Best offline support across iOS/Android |
| Charts | Recharts | Stable, React-native |
| Routing | React Router v6 | Industry standard |
| PWA | vite-plugin-pwa | First-class Vite integration |
| Deployment | Vercel (static) | Zero config for Vite output |
| Sync | JSON export/import | No backend, single-user app |

### What this app is NOT
- It is not a nutrition tracker.
- It does not have a backend, API, or authentication system (yet).
- It does not use Prisma, Supabase, Firebase, or any cloud database.
- It does not use TypeScript, Tailwind, styled-components, or any CSS-in-JS.

---

## 2. Behavioral Rules for All Agents

These are non-negotiable. They apply to every task, every file, every decision.

### 2.1 No temporary solutions. Ever.

If a correct implementation requires more time or complexity, say so and implement it correctly.
Do not:
- Add `// TODO: fix this later` and move on
- Use `any` workarounds or hardcoded magic values as placeholders
- Skip error handling "for now"
- Comment out code instead of deleting it
- Use deprecated APIs because they are "simpler"

If you cannot implement something correctly in the current step, **stop and say so explicitly**
before writing any code. Partial solutions that compile but behave incorrectly are bugs,
not progress.

### 2.2 Challenge instructions before following them

If the user's request is technically incorrect, architecturally unsound, or goes against
better-established practice, **say so first** before implementing anything.

Do not:
- Agree with a flawed approach to avoid friction
- Implement something you know is wrong because the user asked for it
- Stay silent about a better alternative

Do:
- Explain the problem with the requested approach in one or two direct sentences
- Propose the better alternative with a brief justification
- Then ask which path to take, or implement the better one if the improvement is unambiguous

The user's instructions are a starting point, not a final truth.

### 2.3 State of the art only

Use current, stable, widely-adopted solutions. Evaluate every dependency before adding it:
- Is it actively maintained? (last commit within 12 months)
- Does it have known issues on iOS Safari or Android WebView?
- Is there a simpler native solution that avoids the dependency entirely?

Never add a library to solve a problem that can be solved with 10 lines of vanilla JS or CSS.

### 2.4 Mobile-first, offline-first

Every UI decision must be validated against:
- iPhone 7 (iOS 15, Safari, 4.7" screen, 750×1334px)
- Pixel 6 Pro (Android 13, Chrome)
- Huawei Y7a (Android 10, Chrome — no Google Play Services)
- Desktop (Windows, Chrome/Firefox)

Offline capability is not a feature — it is a hard requirement. If any part of the app
requires network access to function (beyond the initial install), that is a bug.

### 2.5 Data integrity above all

This app stores the user's gym history. Data loss is the worst possible failure.
- Never truncate or overwrite data without explicit user confirmation
- Soft-delete only: use `archived_at` or `removed_at` timestamps, never `DELETE`
- Every import must validate the JSON structure before touching any existing data
- If an import fails mid-way, the existing data must remain intact (validate first, then write)

---

## 3. Terminal Commands

**The `&&` operator does not work in this environment.**
Always use `;` to chain terminal commands.

```bash
# WRONG
npm install ; cd src && mkdir components

# CORRECT
npm install ; cd src ; mkdir components
```

When running multiple commands, prefer separate lines or explicit semicolons.
Never assume `&&` will work.

---

## 4. Database Rules

The schema lives in `src/db/db.js` using Dexie.js v3.

### Golden rules
1. **Nothing is ever deleted.** Use `archived_at` for splits and exercises,
   `removed_at` for split-exercise links, `completed_at` for sessions.
2. **IDs are permanent.** When an exercise is renamed, its `id` stays the same.
   All session history references that `id` and remains valid.
3. **Swaps are recorded, not destructive.** A one-day exercise swap creates a new
   `session_exercise` row with `is_swap = true`. The split is never touched.
4. **Schema changes require Dexie version bumps.** If the schema changes, increment
   the database version and write a migration. Never reset the database to apply schema changes.
5. **Units are stored alongside values.** Every `weight` value in `sets` is stored
   with its `unit` ('kg' or 'lb'). Never store a weight without its unit.

### Table reference
```
profile            → single row, personal info, preferred unit
splits             → archived_at for soft delete
exercises          → archived_at, color (hex), name
split_exercises    → split_id, exercise_id, order_index, removed_at
exercise_metadata  → exercise_id, key, value (free key-value pairs)
weekly_schedule    → day_of_week (0=Mon, 6=Sun), split_id
sessions           → date (YYYY-MM-DD), split_id, started_at, completed_at
session_exercises  → session_id, exercise_id, planned_exercise_id, is_swap, completed
sets               → session_exercise_id, set_number, reps, weight, unit, completed
```

---

## 5. Design System

Apply these values globally via CSS custom properties in `:root`.

```css
:root {
  --bg:              #1a1a1a;
  --surface:         #242424;
  --surface-raised:  #2e2e2e;
  --accent:          #4a7c59;
  --accent-hover:    #5a9c6e;
  --text-primary:    #f0f0f0;
  --text-secondary:  #a0a0a0;
  --danger:          #c0392b;
  --border:          #333333;
  --radius:          10px;
  --font:            system-ui, -apple-system, sans-serif;
}
```

### Exercise color palette (dark-theme safe)
```
#e05c5c  red
#e08c3c  orange
#d4c23a  yellow
#6db87a  mint green
#4a90d9  blue
#9b6dd4  purple
#d46da3  pink
#6dbbd4  light blue
#d4916d  salmon
#a0a0a0  gray
```

### UI Rules
- Bottom navigation bar, fixed, 4 tabs: Home, Workout, History, Profile
- Active tab: `var(--accent)`
- All navigation uses React Router — no full page reloads
- Modals on mobile: bottom sheet (slide up), not centered dialog
- Touch targets: minimum 44×44px (Apple HIG standard)
- Numeric inputs: `inputMode="decimal"` for weight, `inputMode="numeric"` for reps
- `padding-bottom: env(safe-area-inset-bottom)` on bottom nav (iPhone home bar)
- No animation libraries — CSS transitions only, max 200ms

---

## 6. PWA Requirements

This is not optional. The app must pass all of the following:

- [ ] Installable on iOS Safari ("Add to Home Screen") on iPhone 7
- [ ] Installable on Android Chrome
- [ ] All routes load offline after first install
- [ ] IndexedDB data persists across sessions and app restarts
- [ ] Manifest includes: name, short_name, icons (192, 512), theme_color, background_color, display: standalone
- [ ] `apple-touch-icon` meta tags present in `index.html`
- [ ] Service worker caches all static assets on install (precache)
- [ ] `vercel.json` rewrites all routes to `index.html`

---

## 7. Code Quality Standards

- **No unused imports.** Every import must be used.
- **No console.log in production code.** Use a flag or remove entirely.
- **No inline styles** unless dynamically computed (e.g., exercise color border).
- **Component files** → `PascalCase.jsx`
- **Utility files** → `camelCase.js`
- **CSS Modules** → `ComponentName.module.css`, same folder as the component
- **Dexie queries** → all in `src/db/` or `src/hooks/`, never inline in components
- **Debounce auto-save** → 500ms on set inputs. Do not save on every keystroke.
- **Error boundaries** → wrap the entire app. Never show a blank screen on crash.

---

## 8. Feature Scope (Current Version)

### In scope
- Profile: name, DOB (calculated age), weight, height, preferred unit
- Splits: create, rename, archive (soft), assign exercises, reorder
- Exercises: create, rename, recolor — editing never creates a duplicate
- Weekly schedule: assign split per day, rest days allowed
- Workout session: start, log sets (weight + reps per set, variable), mark done, end
- Exercise swap: one-day alternative, recorded in history, split unchanged
- Exercise metadata: free key-value pairs, displayed during workout
- History: paginated by week, expandable sessions, swap labeled
- Progress charts: per exercise, max weight over time (Recharts line chart)
- Export/Import: full JSON backup and restore
- Offline: fully functional without network after first load
- Multi-device: via manual JSON export/import (local always wins)

### Explicitly out of scope
- Nutrition, calories, macros — not now, not later in this version
- Rest timers
- Notes per session
- Multiple splits per day
- Authentication / multi-user
- Cloud sync (beyond JSON import/export)
- Social features

If a request falls outside this scope, flag it and ask before implementing.

---

## 9. File Structure Reference

```
gym-tracker/
├── public/
│   ├── icons/          → PWA icons (192, 512)
│   └── manifest.json   → generated by vite-plugin-pwa
├── src/
│   ├── db/
│   │   ├── db.js       → Dexie schema and instance
│   │   └── seed.js     → Demo data for first load
│   ├── hooks/          → Custom React hooks (useProfile, useSplits, etc.)
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Workout.jsx
│   │   ├── History.jsx
│   │   └── Profile.jsx
│   ├── components/     → Shared UI components
│   ├── styles/
│   │   └── global.css  → CSS variables, resets, global styles
│   ├── utils/
│   │   └── units.js    → kg/lb conversion helpers
│   ├── App.jsx
│   └── main.jsx
├── AGENTS.md           → This file
├── vercel.json
├── vite.config.js
└── README.md
```

---

## 10. When in Doubt

Ask before building. A wrong implementation that compiles is harder to fix than
a clarifying question asked upfront. If a requirement is ambiguous, state the
ambiguity explicitly and propose the most reasonable interpretation before proceeding.

One wrong assumption in Step 2 can invalidate Steps 3 through 6.