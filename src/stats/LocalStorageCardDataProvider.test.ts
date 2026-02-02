import { LocalStorageCardDataProvider } from './LocalStorageCardDataProvider';

describe('LocalStorageCardDataProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes table and increments counts', () => {
    const p = new LocalStorageCardDataProvider();
    p.incrementFailure('abc');
    p.incrementSuccess('abc');
    expect(p.getCounts('abc')).toEqual({ success: 1, failure: 1 });

    const tableRaw = window.localStorage.getItem('flashcards:carddata:v1') || '{}';
    const table = JSON.parse(tableRaw);
    expect(table['abc'].success).toBe(1);
    expect(table['abc'].failure).toBe(1);
  });

  it('toggles difficult globally and returns set', () => {
    const p = new LocalStorageCardDataProvider();
    expect(p.isDifficult('x')).toBe(false);
    expect(p.toggleDifficult('x')).toBe(true);
    expect(p.isDifficult('x')).toBe(true);
    const set = p.getDifficult();
    expect(set.has('x')).toBe(true);
  });

  it('migrates legacy stats and difficult keys', () => {
    // Seed legacy stats
    window.localStorage.setItem('flashcards:stats:v1:legacy1', JSON.stringify({ success: 2, failure: 3 }));
    window.localStorage.setItem('flashcards:stats:v1:legacy2', JSON.stringify({ success: 0, failure: 1 }));
    // Seed legacy difficult under two decks
    window.localStorage.setItem('flashcards:difficult:v1:deckA', JSON.stringify(['legacy1']));
    window.localStorage.setItem('flashcards:difficult:v1:deckB', JSON.stringify(['legacy2', 'legacyX']));

    const p = new LocalStorageCardDataProvider();
    expect(p.getCounts('legacy1')).toEqual({ success: 2, failure: 3 });
    expect(p.getCounts('legacy2')).toEqual({ success: 0, failure: 1 });
    // Union of difficult ids
    const diffs = p.getDifficult();
    expect(diffs.has('legacy1')).toBe(true);
    expect(diffs.has('legacy2')).toBe(true);
    expect(diffs.has('legacyX')).toBe(true);
  });
});
