import { aggregateAndDedupe, validateDeckIds, CardItem, sampleN, shuffle, failureRatio, sampleFlagFirst, sampleMixedByPriority } from './utils';

describe('utils.validateDeckIds', () => {
  it('throws on missing id', () => {
    const cards = [
      { id: '', japanese: 'A', hiragana: 'あ', english: 'alpha' } as any as CardItem,
    ];
    expect(() => validateDeckIds(cards)).toThrow(/non-empty string id/i);
  });

  it('throws on duplicate id', () => {
    const cards: CardItem[] = [
      { id: 'x', japanese: 'A', hiragana: 'あ', english: 'alpha' },
      { id: 'x', japanese: 'B', hiragana: 'ぶ', english: 'beta' },
    ];
    expect(() => validateDeckIds(cards)).toThrow(/duplicate id/i);
  });

  it('passes on unique non-empty ids', () => {
    const cards: CardItem[] = [
      { id: 'x1', japanese: 'A', hiragana: 'あ', english: 'alpha' },
      { id: 'x2', japanese: 'B', hiragana: 'ぶ', english: 'beta' },
    ];
    expect(() => validateDeckIds(cards)).not.toThrow();
  });
});

describe('utils.aggregateAndDedupe', () => {
  it('dedupes by japanese, hiragana, or english fields', () => {
    const all: CardItem[] = [
      { id: 'a1', japanese: 'A', hiragana: 'あ', english: 'alpha' },
      { id: 'a2', japanese: 'A', hiragana: 'x', english: 'y' }, // dup japanese
      { id: 'a3', japanese: 'B', hiragana: 'あ', english: 'z' }, // dup hiragana
      { id: 'a4', japanese: 'C', hiragana: 'c', english: 'alpha' }, // dup english
      { id: 'a5', japanese: 'D', hiragana: 'で', english: 'delta' }, // unique
    ];
    const deduped = aggregateAndDedupe(all);
    const ids = deduped.map((c) => c.id);
    expect(ids).toEqual(['a1', 'a5']);
  });
});

describe('utils.sampleN & shuffle', () => {
  it('sampleN returns empty when n <= 0', () => {
    const arr = [1, 2, 3];
    expect(sampleN(arr, 0)).toEqual([]);
    expect(sampleN(arr, -5)).toEqual([]);
  });

  it('sampleN returns at most n items without mutating source', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = arr.slice();
    const out = sampleN(arr, 3);
    expect(out.length).toBe(3);
    expect(arr).toEqual(copy);
    // All items in out must be from source
    out.forEach((x) => expect(arr.includes(x)).toBe(true));
  });

  it('shuffle returns a permutation with same elements', () => {
    const arr = [1, 2, 3];
    const out = shuffle(arr);
    expect(out.sort()).toEqual(arr.slice().sort());
  });

  it('shuffle order can be controlled via Math.random for determinism', () => {
    const randSpy = jest.spyOn(Math, 'random');
    // For a 3-item shuffle, two calls: i=2 and i=1
    randSpy
      .mockReturnValueOnce(0.99) // j=2
      .mockReturnValueOnce(0.0); // j=0
    const out = shuffle([1, 2, 3]);
    // With j=2 then j=0, result is [2,1,3]
    expect(out).toEqual([2, 1, 3]);
    randSpy.mockRestore();
  });
});

describe('priority sampling helpers', () => {
  it('failureRatio computes expected values', () => {
    expect(failureRatio(0, 0)).toBe(0);
    expect(failureRatio(2, 3)).toBeCloseTo(0.6);
    expect(failureRatio(1, 0)).toBe(0);
    expect(failureRatio(0, 5)).toBe(1);
  });

  it('sampleFlagFirst oversubscribe returns top-N flagged by priority', () => {
    const cards: CardItem[] = [
      { id: 'a', japanese: 'A', hiragana: 'あ', english: 'alpha' },
      { id: 'b', japanese: 'B', hiragana: 'ぶ', english: 'beta' },
      { id: 'c', japanese: 'C', hiragana: 'し', english: 'charlie' },
      { id: 'd', japanese: 'D', hiragana: 'で', english: 'delta' },
      { id: 'e', japanese: 'E', hiragana: 'え', english: 'echo' },
    ];
    const flagged = new Set<string>(['a', 'b', 'c', 'd']);
    const priorities: Record<string, number> = { a: 0.2, b: 0.9, c: 0.5, d: 0.7, e: 0.1 };
    const out = sampleFlagFirst(cards, flagged, 3, (x) => priorities[x.id] || 0);
    expect(out.map((x) => x.id)).toEqual(['b', 'd', 'c']);
  });

  it('sampleFlagFirst undersubscribe includes all flagged then fills remainder with mix (ensuring highest priority non-flagged present)', () => {
    const cards: CardItem[] = [
      { id: 'a', japanese: 'A', hiragana: 'あ', english: 'alpha' },
      { id: 'b', japanese: 'B', hiragana: 'ぶ', english: 'beta' },
      { id: 'c', japanese: 'C', hiragana: 'し', english: 'charlie' },
      { id: 'd', japanese: 'D', hiragana: 'で', english: 'delta' },
      { id: 'e', japanese: 'E', hiragana: 'え', english: 'echo' },
      { id: 'f', japanese: 'F', hiragana: 'ふ', english: 'foxtrot' },
    ];
    const flagged = new Set<string>(['a', 'b']);
    const priorities: Record<string, number> = { a: 0.2, b: 0.9, c: 0.8, d: 0.7, e: 0.1, f: 0.6 };
    const out = sampleFlagFirst(cards, flagged, 5, (x) => priorities[x.id] || 0);
    const ids = out.map((x) => x.id);
    // Contains all flagged first
    expect(ids.slice(0, 2)).toEqual(['b', 'a']);
    // Remainder size is n - flaggedCount
    expect(out.length).toBe(5);
    // Highest priority non-flagged ('c') is present in the remainder
    expect(ids.includes('c')).toBe(true);
    // No duplicates
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sampleMixedByPriority returns half random and half prioritized (membership)', () => {
    const cards: CardItem[] = [
      { id: 'a', japanese: 'A', hiragana: 'あ', english: 'alpha' },
      { id: 'b', japanese: 'B', hiragana: 'ぶ', english: 'beta' },
      { id: 'c', japanese: 'C', hiragana: 'し', english: 'charlie' },
      { id: 'd', japanese: 'D', hiragana: 'で', english: 'delta' },
      { id: 'e', japanese: 'E', hiragana: 'え', english: 'echo' },
      { id: 'f', japanese: 'F', hiragana: 'ふ', english: 'foxtrot' },
    ];
    const priorities: Record<string, number> = { a: 0.1, b: 0.2, c: 0.9, d: 0.8, e: 0.3, f: 0.7 };
    const out = sampleMixedByPriority(cards, 4, (x) => priorities[x.id] || 0);
    expect(out.length).toBe(4);
    // Ensure top two priorities among those not picked randomly are present overall
    const topIds = ['c', 'd', 'f']; // top priorities
    const presentTop = topIds.filter((id) => out.some((x) => x.id === id));
    expect(presentTop.length).toBeGreaterThanOrEqual(2);
    // No duplicates
    const ids = out.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
