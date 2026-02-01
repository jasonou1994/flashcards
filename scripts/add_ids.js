#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const decksDir = path.join(__dirname, '..', 'decks');

function pad(n, width = 4) {
  const s = String(n);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

function processFile(filePath) {
  const basename = path.basename(filePath, '.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse JSON: ${filePath}`);
    throw e;
  }
  if (!Array.isArray(data)) {
    console.error(`Not an array: ${filePath}`);
    return;
  }
  const seen = new Set();
  const updated = data.map((item, idx) => {
    const next = { ...item };
    if (typeof next.id !== 'string' || next.id.trim().length === 0) {
      next.id = `${basename}-${pad(idx + 1)}`;
    }
    if (seen.has(next.id)) {
      // If duplicate after assignment, append suffix
      let i = 1;
      let candidate = `${next.id}-${pad(i, 2)}`;
      while (seen.has(candidate)) {
        i += 1;
        candidate = `${next.id}-${pad(i, 2)}`;
      }
      next.id = candidate;
    }
    seen.add(next.id);
    return next;
  });
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`Updated ids in: ${path.basename(filePath)} (${updated.length} items)`);
}

function main() {
  const files = fs.readdirSync(decksDir).filter((f) => f.endsWith('.json'));
  files.forEach((fname) => processFile(path.join(decksDir, fname)));
}

if (require.main === module) {
  main();
}
