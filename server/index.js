const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;
const DECKS_DIR = path.resolve(__dirname, '..', 'decks');

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/decks', (req, res) => {
  fs.readdir(DECKS_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    res.json(jsonFiles);
  });
});

app.get('/api/decks/:name', (req, res) => {
  const name = req.params.name;
  const file = path.join(DECKS_DIR, name);
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: err.message });
    try { res.json(JSON.parse(data)); } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

// Delete a card by index from a deck (in-place edit of JSON file)
app.post('/api/decks/:name/delete', (req, res) => {
  const name = req.params.name;
  const { index } = req.body;
  if (typeof index !== 'number') return res.status(400).json({ error: 'index required' });
  const file = path.join(DECKS_DIR, name);
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: err.message });
    let arr;
    try { arr = JSON.parse(data); } catch (e) { return res.status(500).json({ error: e.message }); }
    if (index < 0 || index >= arr.length) return res.status(400).json({ error: 'index out of bounds' });
    arr.splice(index, 1);
    fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8', (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true, deck: arr });
    });
  });
});

// Replace deck file contents (used for Undo All to restore original file)
app.post('/api/decks/:name/replace', (req, res) => {
  const name = req.params.name;
  const { content } = req.body;
  if (!Array.isArray(content)) return res.status(400).json({ error: 'content must be array' });
  const file = path.join(DECKS_DIR, name);
  fs.writeFile(file, JSON.stringify(content, null, 2), 'utf8', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => console.log(`Flashcards server running on http://localhost:${PORT}`));
