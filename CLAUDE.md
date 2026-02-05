# Claude Code Instructions

> **Sync policy**: This file and `.github/copilot-instructions.md` contain identical project context. When updating either file, always update both to keep them in sync.

---

This repository is a minimal React + Webpack flashcard app for learning Japanese (TypeScript + TSX). The goal of this file is to give an AI coding agent just enough project-specific context to be productive quickly.

Key facts
- Project root contains `package.json`, `webpack.config.js`, and a small `src/` React app.
- Deck data is stored as JSON files in `decks/`. Each file is an array of objects: { id, japanese, hiragana, english, optional examples }.
- The app is intentionally minimal: `src/App.tsx` implements the learning loop and UI; presentational components live in separate files.

How the app works (big picture)
- On startup the app loads a default deck (`decks/chapter1_1.json`) and shuffles it into component state. The left-hand sidebar lists `decks/*.json` discovered via webpack's `require.context`.
- The UI shows one card at a time (`japanese` or `english` on the front, configurable). Clicking flips the card to reveal back-side details (`japanese`, `hiragana`, `english`, and optional examples). Keyboard shortcuts:
  - Space: flip the current card
  - Enter: mark the current card as Known

Selecting a deck in the sidebar loads that JSON and starts a deck run for that deck. Random runs aggregate all decks, dedupe across `japanese`/`hiragana`/`english`, then sample `N` cards.
- User actions:
  - Known: removes the current card from the deck (won't be shown again).
  - Unknown: reinserts the current card into the deck after shuffling (so it may reappear later).
  - Skip: moves to the next card without changing deck membership.
- A deck run ends when the deck becomes empty; the UI shows a "Restart" button that begins a new deck run for the same deck with the original cards reshuffled.

Conventions and patterns to follow
- Single-page React app with function components and hooks (no class components).
- Keep deck data as plain JSON; avoid introducing backend APIs unless explicitly requested.
- UI and state orchestration live in `src/App.tsx`. Presentational components (`HtmlOrText`, `Card`) live in `src/HtmlOrText.tsx` and `src/Card.tsx`. Small helpers (e.g., `shuffle`, `sampleN`, `aggregateAndDedupe`) live in `src/utils.ts`.

Developer workflows (commands)
- Install and run dev server:
  - npm install
  - npm start  # runs webpack-dev-server on port 3000 and opens the browser
- Build for production: `npm run build`
- The app is served by webpack-dev-server; changes to source files trigger HMR.
- Run tests: `npm test` (watch mode: `npm run test:watch`)

Agent workflow policy
- Do not commit or push any changes unless explicitly requested by the repo owner in the conversation. Perform edits locally and run tests/builds, but avoid `git commit`/`git push` until instructed.

Files to inspect when making changes
- `decks/*.json` — deck sources of truth for cards.
- `src/App.tsx` — main logic for shuffle, flip, mark known/unknown, deck lifecycle, random sampling.
- `src/index.tsx`, `src/styles.css` — entry and styling.
- `webpack.config.js` — dev server, build, and asset behavior.
- `decks/` — folder containing per-deck JSON files. The app discovers these via webpack's `require.context`.

Common tasks and examples
- Adding a new field to cards (e.g., `level`):
  - Update `decks/*.json` entries.
  - Update `src/Card.tsx`/`src/App.tsx` to read and render the new field. Keep state logic intact: maintain deck as an array of card objects.
- Persisting progress across reloads (optional enhancement):
  - Use `localStorage` keyed by repo name. Saved progress persists across deck runs and browser sessions; each tab/window maintains its own session and can restore or continue a deck run independently.

Utilities and types pattern
- Extract non-React, pure logic into `src/utils.ts` (e.g., `validateDeckIds`, `aggregateAndDedupe`, shared types like `CardItem`).
- Keep React components thin: import utility functions/types from `utils.ts`.
- Add dedicated unit tests for utilities (e.g., `src/utils.test.ts`) covering validation and dedupe logic.

Stats and difficult flagging
- Stats provider: `src/stats/LocalStorageStatsProvider.ts` persists per-card counts in localStorage under `flashcards:stats:v1:${cardId}`.
  - Counts update on `Known`/`Unknown` actions in `src/App.tsx` via `incrementSuccess(id)` / `incrementFailure(id)`.
  - A run-level gate (`countedThisRun: Set<string>`) prevents double-counting the same `card.id` within a single deck run.
- Difficult provider: `src/stats/LocalStorageDifficultProvider.ts` persists a per-deck set of difficult `card.id`s in localStorage under `flashcards:difficult:v1:${deckId}`.
  - `deckId` is the current `selectedDeckKey` (deck file path) or `__random__` for random runs.
  - API: `isDifficult(deckId, id)`, `toggleDifficult(deckId, id)`, `getDifficult(deckId)`.
- Card IDs: all cards must include a non-empty unique `id`. `validateDeckIds()` is called on deck load, random sampling, and restart; it throws on missing/duplicate ids.
- UI actions bar: `src/Card.tsx` renders a top bar on both front and back containing:
  - A flag toggle button (left): grey when not flagged, red when flagged. Class names: `.flag-button` and `.flag-button.active`.
  - Stats counts (right): `success / (success + failure)`, using `.card-stats-overlay`.
  - The bar is `.card-actions`, absolutely positioned; clicks on the bar use `stopPropagation()` to avoid flipping the card.
- Components: `HtmlOrText` and `Card` live in `src/HtmlOrText.tsx` and `src/Card.tsx`.


Server-backed editing has been removed; the app is purely client-side and reads static JSON decks bundled at build time.

Edge-cases & constraints
- The app imports `deck.json` at build time. If a user expects runtime editing of the file without rebuilding, they'll need a server endpoint — note that introducing a server changes the project's scope.
- The deck is small; no performance optimizations for huge decks are implemented.

When editing code, run these quick checks
- npm start — confirm the dev server loads and the app opens at http://localhost:3000
- Verify shuffle/known/unknown flows: mark a card known and confirm it disappears; mark unknown and confirm it reappears later.
- npm test — ensure the unit tests pass before and after changes.

Glossary
- Session: The entire time a user is using the app. Each browser tab/window is a separate session.
- Deck run: A single pass of a selected deck from start (load + shuffle) to completion or restart.

Testing policy
 - All code changes should include accompanying tests covering the new or changed behavior.
 - App UI tests live in `src/App.test.tsx`. Component and provider tests live alongside their modules:
   - `src/HtmlOrText.test.tsx`, `src/Card.test.tsx`
   - `src/stats/LocalStorageStatsProvider.test.ts`, `src/stats/LocalStorageDifficultProvider.test.ts`
 - After making changes, always run the test suite locally (`npm test`) and fix any failures before committing.

If you (the agent) make changes, include in the PR description:
- What user-visible behavior changed (one sentence).
- Any new dependencies added and why.

If anything in this file is unclear or you need additional conventions (testing style, CI, or accessibility requirements), ask the repo owner for clarification.
