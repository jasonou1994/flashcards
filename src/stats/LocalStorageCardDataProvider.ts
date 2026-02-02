import type { CardDataProvider, CardRecord, CardStats } from './CardDataProvider';

const TABLE_KEY = 'flashcards:carddata:v1';
const MIGRATED_KEY = 'flashcards:carddata:migrated:v1';
const LEGACY_STATS_PREFIX = 'flashcards:stats:v1:';
const LEGACY_DIFF_PREFIX = 'flashcards:difficult:v1:';

function isValidNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

function readTable(): Record<string, CardRecord> {
  try {
    const raw = window.localStorage.getItem(TABLE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') {
      const out: Record<string, CardRecord> = {};
      for (const [k, v] of Object.entries(obj as Record<string, any>)) {
        const success = isValidNumber(v?.success) ? v.success : 0;
        const failure = isValidNumber(v?.failure) ? v.failure : 0;
        const difficult = typeof v?.difficult === 'boolean' ? v.difficult : false;
        out[k] = { success, failure, difficult };
      }
      return out;
    }
  } catch {
    // ignore
  }
  return {};
}

function writeTable(table: Record<string, CardRecord>): void {
  try {
    window.localStorage.setItem(TABLE_KEY, JSON.stringify(table));
  } catch {
    // ignore
  }
}

function ensureRecord(table: Record<string, CardRecord>, cardId: string): CardRecord {
  if (!table[cardId]) {
    table[cardId] = { success: 0, failure: 0, difficult: false };
  }
  return table[cardId];
}

function migrateLegacyIfNeeded(): void {
  try {
    const migrated = window.localStorage.getItem(MIGRATED_KEY);
    if (migrated === 'true') return;
    // If we already have a table, mark migrated and return
    const hasTable = !!window.localStorage.getItem(TABLE_KEY);
    const table: Record<string, CardRecord> = hasTable ? readTable() : {};

    // Merge legacy stats
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i) || '';
      if (key.startsWith(LEGACY_STATS_PREFIX)) {
        const cardId = key.substring(LEGACY_STATS_PREFIX.length);
        try {
          const raw = window.localStorage.getItem(key);
          const obj = raw ? JSON.parse(raw) : null;
          const success = isValidNumber(obj?.success) ? obj.success : 0;
          const failure = isValidNumber(obj?.failure) ? obj.failure : 0;
          const rec = ensureRecord(table, cardId);
          // Prefer max to avoid losing data if table had values already
          rec.success = Math.max(rec.success, success);
          rec.failure = Math.max(rec.failure, failure);
        } catch {
          // ignore corrupt legacy entries
        }
      }
    }

    // Merge legacy difficult sets across ALL decks (union)
    const difficultUnion = new Set<string>();
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i) || '';
      if (key.startsWith(LEGACY_DIFF_PREFIX)) {
        try {
          const raw = window.localStorage.getItem(key);
          const arr = raw ? JSON.parse(raw) : null;
          if (Array.isArray(arr)) {
            for (const id of arr) {
              if (typeof id === 'string') difficultUnion.add(id);
            }
          }
        } catch {
          // ignore
        }
      }
    }
    for (const id of difficultUnion) {
      const rec = ensureRecord(table, id);
      rec.difficult = true;
    }

    // Write table and mark migrated
    writeTable(table);
    window.localStorage.setItem(MIGRATED_KEY, 'true');
  } catch {
    // ignore
  }
}

export class LocalStorageCardDataProvider implements CardDataProvider {
  constructor() {
    migrateLegacyIfNeeded();
  }

  private read(): Record<string, CardRecord> {
    return readTable();
  }

  private write(table: Record<string, CardRecord>): void {
    writeTable(table);
  }

  private getRecord(cardId: string): CardRecord {
    const table = this.read();
    const rec = ensureRecord(table, cardId);
    this.write(table);
    return rec;
  }

  incrementSuccess(cardId: string): void {
    const table = this.read();
    const rec = ensureRecord(table, cardId);
    rec.success += 1;
    this.write(table);
  }

  incrementFailure(cardId: string): void {
    const table = this.read();
    const rec = ensureRecord(table, cardId);
    rec.failure += 1;
    this.write(table);
  }

  decrementSuccess(cardId: string): void {
    const table = this.read();
    const rec = ensureRecord(table, cardId);
    rec.success = Math.max(0, rec.success - 1);
    this.write(table);
  }

  decrementFailure(cardId: string): void {
    const table = this.read();
    const rec = ensureRecord(table, cardId);
    rec.failure = Math.max(0, rec.failure - 1);
    this.write(table);
  }

  getCounts(cardId: string): CardStats {
    const rec = this.getRecord(cardId);
    return { success: rec.success, failure: rec.failure };
  }

  isDifficult(cardId: string): boolean {
    const rec = this.getRecord(cardId);
    return rec.difficult === true;
  }

  toggleDifficult(cardId: string): boolean {
    const table = this.read();
    const rec = ensureRecord(table, cardId);
    rec.difficult = !rec.difficult;
    this.write(table);
    return rec.difficult;
  }

  getDifficult(): Set<string> {
    const table = this.read();
    const out = new Set<string>();
    for (const [id, rec] of Object.entries(table)) {
      if (rec.difficult) out.add(id);
    }
    return out;
  }
}
