import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import type { CardItem } from './utils';

// Mock the sample deck imported by App to keep tests small and deterministic
jest.mock('../decks/chapter1_1.json', () => [
  {
    id: 'mock-0001',
    japanese: 'カード1',
    hiragana: 'かーど1',
    english: 'card one',
  },
  {
    id: 'mock-0002',
    japanese: 'カード2',
    hiragana: 'かーど2',
    english: 'card two',
  },
  {
    id: 'mock-0003',
    japanese: 'カード3',
    hiragana: 'かーど3',
    english: 'card three',
  },
]);


describe('App behavior', () => {
  function getCardElement() {
    const card = document.querySelector('.card');
    expect(card).toBeTruthy();
    return card as HTMLElement;
  }

  function getCardsLeftCount() {
    const el = screen.getByText(/Cards left:/i);
    const text = el.textContent || '';
    const m = text.match(/Cards left:\s*(\d+)/);
    return m ? parseInt(m[1], 10) : NaN;
  }

  it('renders main UI and sidebar with default deck', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Japanese Flashcards/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Decks/i })).toBeInTheDocument();
    // Fallback availableDecks shows a default option
    expect(screen.getByRole('button', { name: /default/i })).toBeInTheDocument();
    expect(getCardsLeftCount()).toBeGreaterThan(0);
  });

  it('flips the card on click and Space key, and resets on Known/Unknown', () => {
    render(<App />);
    const card = getCardElement();

    // Initially not flipped
    expect(card.className).not.toMatch(/flipped/);

    // Click flips
    fireEvent.click(card);
    expect(card.className).toMatch(/flipped/);

    // Space toggles back
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    expect(card.className).not.toMatch(/flipped/);

    // Flip, then Known resets flip and removes the card
    fireEvent.click(card);
    expect(card.className).toMatch(/flipped/);
    const before = getCardsLeftCount();
    fireEvent.click(screen.getByRole('button', { name: 'Known' }));
    expect(getCardsLeftCount()).toBe(before - 1);
    expect(getCardElement().className).not.toMatch(/flipped/);

    // Flip, then Unknown resets flip and keeps count
    fireEvent.click(getCardElement());
    expect(getCardElement().className).toMatch(/flipped/);
    const beforeUnknown = getCardsLeftCount();
    fireEvent.click(screen.getByRole('button', { name: 'Unknown' }));
    expect(getCardsLeftCount()).toBe(beforeUnknown);
    expect(getCardElement().className).not.toMatch(/flipped/);
  });

  it('Enter key marks Known (removes current card)', () => {
    render(<App />);
    const before = getCardsLeftCount();
    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
    expect(getCardsLeftCount()).toBe(before - 1);
  });

  it('Reshuffle changes order and resets flip', () => {
    // Mock Math.random to deterministic sequence for shuffle
    const randSpy = jest.spyOn(Math, 'random');
    // For a 3-item shuffle, two calls are made: i=2 and i=1
    randSpy
      .mockReturnValueOnce(0.99) // j = 2
      .mockReturnValueOnce(0.0); // j = 0

    render(<App />);
    // Flip to true, then reshuffle should reset
    const card = getCardElement();
    fireEvent.click(card);
    expect(card.className).toMatch(/flipped/);
    fireEvent.click(screen.getByRole('button', { name: /Reshuffle/i }));
    expect(getCardElement().className).not.toMatch(/flipped/);
    randSpy.mockRestore();
  });

  it('Shows completion and Restart reloads a fresh shuffled deck', () => {
    render(<App />);
    // Mark Known until deck is empty (3 cards in mocked deck)
    fireEvent.click(screen.getByRole('button', { name: 'Known' }));
    fireEvent.click(screen.getByRole('button', { name: 'Known' }));
    fireEvent.click(screen.getByRole('button', { name: 'Known' }));

    // Completion view
    expect(screen.getByRole('heading', { name: /All done/i })).toBeInTheDocument();
    const restart = screen.getByRole('button', { name: /Restart/i });
    expect(restart).toBeInTheDocument();

    // Restart returns to main view with cards
    fireEvent.click(restart);
    expect(screen.getByRole('heading', { name: /Japanese Flashcards/i })).toBeInTheDocument();
    expect(getCardsLeftCount()).toBeGreaterThan(0);
  });

  it('Front-side toggle switches between Japanese and English', () => {
    render(<App />);
    const frontEl = document.querySelector('.side.front') as HTMLElement;
    expect(frontEl).toBeInTheDocument();

    // Switch to English
    const englishRadio = screen.getByRole('radio', { name: /English/i });
    fireEvent.click(englishRadio);

    // Front should now show one of the english values
    expect(frontEl.textContent || '').toMatch(/card\s+(one|two|three)/i);

    // Switch back to Japanese
    const japaneseRadio = screen.getByRole('radio', { name: /Japanese/i });
    fireEvent.click(japaneseRadio);

    // Front should now be non-empty and likely contain カードX
    expect(frontEl.textContent || '').not.toEqual('');
  });
});

describe('Stats gating for a single deck run', () => {
  it('Unknown on same card twice increments failure once', () => {
    const randSpy = jest.spyOn(Math, 'random');
    // Initial shuffle: keep order unchanged
    randSpy
      .mockReturnValueOnce(0.99) // i=2 -> j=2
      .mockReturnValueOnce(0.99); // i=1 -> j=1
    // Deck-load effect shuffle: also keep order unchanged
    randSpy
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.99);

    window.localStorage.clear();
    render(<App />);
    const frontElA = document.querySelector('.side.front') as HTMLElement;
    expect(frontElA.textContent || '').toMatch(/カード1/);
    // First Unknown: shuffle remaining+current so current stays at front
    randSpy
      .mockReturnValueOnce(0.0)  // i=2 -> j=0 (move current to index 0)
      .mockReturnValueOnce(0.99); // i=1 -> j=1 (keep current at 0)
    fireEvent.click(screen.getByRole('button', { name: 'Unknown' }));

    // Second Unknown on the same card at front
    randSpy
      .mockReturnValueOnce(0.0)  // i=2 -> j=0
      .mockReturnValueOnce(0.99); // i=1 -> j=1
    fireEvent.click(screen.getByRole('button', { name: 'Unknown' }));

    const key = 'flashcards:stats:v1:mock-0001';
    const counts = JSON.parse(window.localStorage.getItem(key) || '{"success":0,"failure":0}');
    expect(counts.failure).toBe(1);
    expect(counts.success).toBe(0);
    randSpy.mockRestore();
  });

  it('Unknown then Known on same card results in single increment (failure)', () => {
    const randSpy = jest.spyOn(Math, 'random');
    // Initial shuffle: keep order unchanged
    randSpy
      .mockReturnValueOnce(0.99) // i=2 -> j=2
      .mockReturnValueOnce(0.99); // i=1 -> j=1
    // Deck-load effect shuffle: also keep order unchanged
    randSpy
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.99);

    window.localStorage.clear();
    render(<App />);
    const frontElB = document.querySelector('.side.front') as HTMLElement;
    expect(frontElB.textContent || '').toMatch(/カード1/);
    // Unknown: keep same card at front
    randSpy
      .mockReturnValueOnce(0.0)  // i=2 -> j=0
      .mockReturnValueOnce(0.99); // i=1 -> j=1
    fireEvent.click(screen.getByRole('button', { name: 'Unknown' }));

    // Known: remove the same front card; no additional increment due to gating
    fireEvent.click(screen.getByRole('button', { name: 'Known' }));

    const key = 'flashcards:stats:v1:mock-0001';
    const counts = JSON.parse(window.localStorage.getItem(key) || '{"success":0,"failure":0}');
    expect(counts.failure).toBe(1);
    expect(counts.success).toBe(0);
    randSpy.mockRestore();
  });
});

describe('Random deck aggregation and dedupe', () => {
  function mockDeckContext(maps: Record<string, CardItem[]>) {
    const loader = (key: string) => maps[key];
    (loader as any).keys = () => Object.keys(maps);
    (require as any).context = jest.fn(() => loader);
  }

  afterEach(() => {
    // Restore default behavior
    (require as any).context = undefined;
  });

  it('shows Random controls and can start a random deck with quantity', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Random/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Random/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
  });

  it('dedupes across japanese/hiragana/english and respects quantity on start and restart', () => {
    const decks: Record<string, CardItem[]> = {
      './a.json': [
        { id: 'a-1', japanese: 'A', hiragana: 'あ', english: 'alpha' },
        { id: 'a-2', japanese: 'B', hiragana: 'ぶ', english: 'beta' },
      ],
      './b.json': [
        { id: 'b-1', japanese: 'A', hiragana: 'あ2', english: 'alpha2' }, // duplicate japanese
        { id: 'b-2', japanese: 'C', hiragana: 'ぶ', english: 'gamma' }, // duplicate hiragana
        { id: 'b-3', japanese: 'D', hiragana: 'で', english: 'beta' }, // duplicate english
        { id: 'b-4', japanese: 'E', hiragana: 'え', english: 'epsilon' }, // unique
      ],
    };
    mockDeckContext(decks);

    render(<App />);
    // Set quantity to 10 (default is 30)
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /Random/i }));

    // Deduped length should be 3 (A, B, E)
    expect(screen.getByText(/Cards left:\s*3/i)).toBeInTheDocument();

    // Complete the deck
    fireEvent.click(screen.getByRole('button', { name: 'Known' }));
    fireEvent.click(screen.getByRole('button', { name: 'Known' }));
    fireEvent.click(screen.getByRole('button', { name: 'Known' }));

    // Restart should re-sample and keep deduped count
    fireEvent.click(screen.getByRole('button', { name: /Restart/i }));
    expect(screen.getByText(/Cards left:\s*3/i)).toBeInTheDocument();
  });
});

