import type { CardStats, StatsProvider } from './StatsProvider';

const STORAGE_PREFIX = 'flashcards:stats:v1:';

function storageKey(cardId: string): string {
  return `${STORAGE_PREFIX}${cardId}`;
}

function readCounts(cardId: string): CardStats {
  try {
    const raw = localStorage.getItem(storageKey(cardId));
    if (!raw) return { success: 0, failure: 0 };
    const parsed = JSON.parse(raw);
    const s = Number(parsed?.success ?? 0);
    const f = Number(parsed?.failure ?? 0);
    return {
      success: Number.isFinite(s) && s >= 0 ? s : 0,
      failure: Number.isFinite(f) && f >= 0 ? f : 0,
    };
  } catch {
    return { success: 0, failure: 0 };
  }
}

function writeCounts(cardId: string, counts: CardStats): void {
  try {
    localStorage.setItem(storageKey(cardId), JSON.stringify(counts));
  } catch {
    // Ignore storage errors
  }
}

export class LocalStorageStatsProvider implements StatsProvider {
  incrementSuccess(cardId: string): void {
    const counts = readCounts(cardId);
    counts.success += 1;
    writeCounts(cardId, counts);
  }

  incrementFailure(cardId: string): void {
    const counts = readCounts(cardId);
    counts.failure += 1;
    writeCounts(cardId, counts);
  }

  decrementSuccess(cardId: string): void {
    const counts = readCounts(cardId);
    counts.success = Math.max(0, counts.success - 1);
    writeCounts(cardId, counts);
  }

  decrementFailure(cardId: string): void {
    const counts = readCounts(cardId);
    counts.failure = Math.max(0, counts.failure - 1);
    writeCounts(cardId, counts);
  }

  getCounts(cardId: string): CardStats {
    return readCounts(cardId);
  }
}

export default LocalStorageStatsProvider;
