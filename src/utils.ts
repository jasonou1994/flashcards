export interface CardItem {
  id: string;
  japanese: string;
  hiragana: string;
  english: string;
  japanese_example?: string;
  english_example?: string;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sampleN<T>(arr: T[], n: number): T[] {
  if (n <= 0) return [];
  const shuffled = shuffle(arr);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

export function validateDeckIds(cards: CardItem[]): void {
  const seen = new Set<string>();
  for (const c of cards) {
    const id = (c as any).id;
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Deck validation error: each card must have a non-empty string id');
    }
    if (seen.has(id)) {
      throw new Error(`Deck validation error: duplicate id detected: ${id}`);
    }
    seen.add(id);
  }
}

// Dedupe by any of the core string fields
export function aggregateAndDedupe(all: CardItem[]): CardItem[] {
  const seenJ = new Set<string>();
  const seenH = new Set<string>();
  const seenE = new Set<string>();
  const deduped: CardItem[] = [];
  for (const c of all) {
    const j = (c.japanese || '').trim();
    const h = (c.hiragana || '').trim();
    const e = (c.english || '').trim();
    if (seenJ.has(j) || seenH.has(h) || seenE.has(e)) continue;
    deduped.push(c);
    if (j) seenJ.add(j);
    if (h) seenH.add(h);
    if (e) seenE.add(e);
  }
  return deduped;
}

// Compute failure ratio given success/failure counts
export function failureRatio(success: number, failure: number): number {
  const total = success + failure;
  if (total <= 0) return 0;
  return failure / total;
}

// Select n items: half random, half by highest priority (excluding already chosen)
export function sampleMixedByPriority<T extends { id: string }>(
  arr: T[],
  n: number,
  getPriority: (item: T) => number
): T[] {
  if (n <= 0 || arr.length === 0) return [];
  const k = Math.floor(n / 2);
  const randomPart = sampleN(arr, Math.min(k, arr.length));
  const chosen = new Set<string>(randomPart.map((x) => x.id));
  const remaining = arr.filter((x) => !chosen.has(x.id));
  const need = Math.min(n - randomPart.length, remaining.length);
  const prioritized = remaining
    .slice()
    .sort((a, b) => getPriority(b) - getPriority(a))
    .slice(0, need);
  return randomPart.concat(prioritized);
}

// Prioritize flagged items first (sorted by priority desc), then fill remainder using sampleMixedByPriority
export function sampleFlagFirst<T extends { id: string }>(
  arr: T[],
  flaggedIds: Set<string>,
  n: number,
  getPriority: (item: T) => number
): T[] {
  if (n <= 0 || arr.length === 0) return [];
  const flagged = arr.filter((x) => flaggedIds.has(x.id));
  const sortedFlagged = flagged.slice().sort((a, b) => getPriority(b) - getPriority(a));
  if (sortedFlagged.length >= n) {
    return sortedFlagged.slice(0, n);
  }
  const selected = sortedFlagged.slice();
  const remainingCandidates = arr.filter((x) => !flaggedIds.has(x.id));
  const remainder = sampleMixedByPriority(remainingCandidates, n - selected.length, getPriority);
  return selected.concat(remainder);
}
