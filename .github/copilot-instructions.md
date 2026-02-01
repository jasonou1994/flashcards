This repository is a minimal React + Webpack flashcard app for learning Japanese. The goal of this file is to give an AI coding agent just enough project-specific context to be productive quickly.

Key facts
- Project root contains `package.json`, `webpack.config.js`, and a small `src/` React app.
- Deck data is stored as JSON files in `decks/` (or `deck.json` at root). Each file is an array of objects: { japanese, hiragana, english }.
- The app is intentionally minimal: `src/App.jsx` implements the learning loop and UI.

How the app works (big picture)
- On startup the app imports `deck.json` (statically bundled). The deck is shuffled and stored in component state. This initializes a deck run for the default deck.
- The UI shows one card at a time (`japanese` on the front). Clicking flips the card to reveal `hiragana` and `english`. Keyboard shortcuts:
  - Space: flip the current card
  - Enter: mark the current card as Known

The left-hand sidebar lists JSON files from `decks/`. Selecting a deck loads that JSON and starts a deck run for that deck.
- User actions:
  - Known: removes the current card from the deck (won't be shown again).
  - Unknown: reinserts the current card into the deck after shuffling (so it may reappear later).
  - Skip: moves to the next card without changing deck membership.
- A deck run ends when the deck becomes empty; the UI shows a "Restart" button that begins a new deck run for the same deck with the original cards reshuffled.

Conventions and patterns to follow
- Single-page React app with function components and hooks (no class components).
- Keep deck data as plain JSON; avoid introducing backend APIs unless explicitly requested.
- UI and state are co-located in `src/App.jsx`. Small helper functions (e.g., `shuffle`) live next to components. This file manages the deck run lifecycle.

Developer workflows (commands)
- Install and run dev server:
  - npm install
  - npm start  # runs webpack-dev-server on port 3000 and opens the browser
- Build for production: `npm run build`
- The app is served by webpack-dev-server; changes to source files trigger HMR.
 - Run tests: `npm test` (watch mode: `npm run test:watch`)

Files to inspect when making changes
- `deck.json` — the source of truth for cards.
- `src/App.jsx` — main logic for shuffle, flip, mark known/unknown, deck lifecycle.
- `src/index.jsx`, `src/styles.css` — entry and styling.
- `webpack.config.js` — dev server, build, and asset behavior.
 - `decks/` — folder containing per-deck JSON files. The app discovers these via webpack's `require.context`.

Common tasks and examples
- Adding a new field to cards (e.g., `level`):
  - Update `deck.json` entries.
  - Update `src/App.jsx` to read and render the new field. Keep state logic intact: maintain deck as an array of card objects.
- Persisting progress across reloads (optional enhancement):
  - Use `localStorage` keyed by repo name. Saved progress persists across deck runs and browser sessions; each tab/window maintains its own session and can restore or continue a deck run independently.

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
 - App UI tests live in `src/App.test.tsx`. Library/provider units may include dedicated test files (e.g., `src/stats/LocalStorageStatsProvider.test.ts`).
 - After making changes, always run the test suite locally (`npm test`) and fix any failures before committing.

If you (the agent) make changes, include in the PR description:
- What user-visible behavior changed (one sentence).
- Any new dependencies added and why.

If anything in this file is unclear or you need additional conventions (testing style, CI, or accessibility requirements), ask the repo owner for clarification.
