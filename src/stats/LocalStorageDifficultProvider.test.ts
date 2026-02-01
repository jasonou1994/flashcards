import { LocalStorageDifficultProvider } from './LocalStorageDifficultProvider';

describe('LocalStorageDifficultProvider', () => {
  const deckA = 'test-deck-A';
  const deckB = 'test-deck-B';
  const cardId = 'card-001';

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to not difficult and toggles on/off', () => {
    const p = new LocalStorageDifficultProvider();
    expect(p.isDifficult(deckA, cardId)).toBe(false);
    const nowOn = p.toggleDifficult(deckA, cardId);
    expect(nowOn).toBe(true);
    expect(p.isDifficult(deckA, cardId)).toBe(true);
    const nowOff = p.toggleDifficult(deckA, cardId);
    expect(nowOff).toBe(false);
    expect(p.isDifficult(deckA, cardId)).toBe(false);
  });

  it('persists per-deck and isolates between decks', () => {
    const p = new LocalStorageDifficultProvider();
    p.toggleDifficult(deckA, cardId);
    expect(p.isDifficult(deckA, cardId)).toBe(true);
    expect(p.isDifficult(deckB, cardId)).toBe(false);
    const p2 = new LocalStorageDifficultProvider();
    expect(p2.isDifficult(deckA, cardId)).toBe(true);
    expect(p2.isDifficult(deckB, cardId)).toBe(false);
  });

  it('handles corrupted storage gracefully', () => {
    const p = new LocalStorageDifficultProvider();
    const key = 'flashcards:difficult:v1:' + deckA;
    window.localStorage.setItem(key, 'not-json');
    expect(p.isDifficult(deckA, cardId)).toBe(false);
    // Toggle should recover by writing a valid set
    p.toggleDifficult(deckA, cardId);
    expect(p.isDifficult(deckA, cardId)).toBe(true);
  });
});
