# Flashcards

Small React + Webpack flashcard app for learning Japanese. Run locally with Node.js.

Quick start

Install deps and run dev server:

```bash
npm install
npm start
```

Open http://localhost:3000

Edit `deck.json` to change the cards. Each item is { japanese, hiragana, english }.
 
Notes
- The app lists decks from the `decks/` folder; select a deck from the sidebar.
- Actions: flip the card, mark as Known (removes it), or mark as Unknown (reinserted after shuffle). Skip/Delete/Undo features have been removed to simplify the workflow.

Completion & Restart
- A deck run ends when the deck becomes empty. Click “Restart” to begin a new deck run with the same deck reshuffled.

Glossary
- Session: The entire time a user is using the app. Each browser tab/window is a separate session.
- Deck run: A single pass of a selected deck from start (load + shuffle) to completion or restart.

Coding Guidelines
- Comments should reflect current behavior: keep comments accurate to what the code does now. Avoid change-log style notes like "we changed X" or "used to do Y".
- Remove or update outdated comments when modifying code so they never drift.
- Prefer tests and this README for higher-level rationale; keep source comments concise and truthful to the present implementation.
