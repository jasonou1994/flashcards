import { aggregateAndDedupe, validateDeckIds, CardItem, sampleN, shuffle } from './utils';

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
