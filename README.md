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
