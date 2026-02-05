import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Stats from './Stats';
import type { CardItem } from './utils';

function mockDeckContext(maps: Record<string, CardItem[]>) {
  const loader = (key: string) => maps[key];
  (loader as any).keys = () => Object.keys(maps);
  (require as any).context = jest.fn(() => loader);
  (globalThis as any).__TEST_DECKS__ = maps;
}

afterEach(() => {
  (require as any).context = undefined;
  delete (globalThis as any).__TEST_DECKS__;
  window.localStorage.clear();
});

describe('Stats tab UI', () => {
  it('renders sidebar, toolbar, and grid with aggregated cards by default', () => {
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
    render(<Stats />);

    // Headers
    expect(screen.getByRole('heading', { name: /Stats/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Decks/i })).toBeInTheDocument();

    // Toolbar controls
    expect(screen.getByLabelText(/Order by/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Flagged only/i)).toBeInTheDocument();

    // Aggregated and deduped: expect 3 unique cards (A, B, E)
    const cards = document.querySelectorAll('.card');
    expect(cards.length).toBe(3);
  });

  it('filters by deck selection and toggles off when clicking again', () => {
    const decks: Record<string, CardItem[]> = {
      './a.json': [
        { id: 'a-1', japanese: 'A', hiragana: 'あ', english: 'alpha' },
        { id: 'a-2', japanese: 'B', hiragana: 'ぶ', english: 'beta' },
      ],
      './b.json': [
        { id: 'b-4', japanese: 'E', hiragana: 'え', english: 'epsilon' },
      ],
    };
    mockDeckContext(decks);
    render(<Stats />);

    // Click deck A -> shows 2 cards
    const deckAButton = screen.getByRole('button', { name: /a\.json/i });
    fireEvent.click(deckAButton);
    expect(document.querySelectorAll('.card').length).toBe(2);

    // Click again -> unfilter, back to aggregated deduped 3 cards
    fireEvent.click(deckAButton);
    expect(document.querySelectorAll('.card').length).toBe(3);
  });

  it('flagged-only toggle filters to difficult cards', () => {
    const decks: Record<string, CardItem[]> = {
      './a.json': [
        { id: 'a-1', japanese: 'A', hiragana: 'あ', english: 'alpha' },
        { id: 'a-2', japanese: 'B', hiragana: 'ぶ', english: 'beta' },
      ],
    };
    mockDeckContext(decks);
    render(<Stats />);

    // Flag the first card via its flag button
    const flagBtn = document.querySelector('.flag-button') as HTMLElement;
    expect(flagBtn).toBeTruthy();
    fireEvent.click(flagBtn);

    // Toggle flagged-only -> should show 1 card
    const flaggedToggle = screen.getByLabelText(/Flagged only/i);
    fireEvent.click(flaggedToggle);
    expect(document.querySelectorAll('.card').length).toBe(1);
  });

  it('orders by success rate ascending by default and can reverse ordering', () => {
    const decks: Record<string, CardItem[]> = {
      './a.json': [
        { id: 'a-1', japanese: 'A', hiragana: 'あ', english: 'alpha' },
        { id: 'a-2', japanese: 'B', hiragana: 'ぶ', english: 'beta' },
      ],
    };
    // Pre-populate counts: a-1 failure ratio higher than a-2
    const table = {
      'a-1': { success: 0, failure: 3, difficult: false },
      'a-2': { success: 3, failure: 0, difficult: false },
    } as any;
    window.localStorage.setItem('flashcards:carddata:v1', JSON.stringify(table));

    mockDeckContext(decks);
    render(<Stats />);

    const cardsBefore = Array.from(document.querySelectorAll('.card')) as HTMLElement[];
    // Ascending success rate: lowest success rate first -> a-1
    expect(cardsBefore[0].textContent || '').toMatch(/A|alpha/i);

    // Reverse ordering
    const orderToggle = screen.getByLabelText(/Ascending|Descending/i);
    fireEvent.click(orderToggle);

    const cardsAfter = Array.from(document.querySelectorAll('.card')) as HTMLElement[];
    // Descending success rate: highest success rate first -> a-2
    expect(cardsAfter[0].textContent || '').toMatch(/B|beta/i);
  });

  it('displays 0/0 cards at the bottom regardless of order', () => {
    const decks: Record<string, CardItem[]> = {
      './a.json': [
        { id: 'a-1', japanese: 'ZERO', hiragana: 'ぜろ', english: 'zero' }, // 0/0
        { id: 'a-2', japanese: 'HIGH', hiragana: 'はい', english: 'high' }, // 3/0
        { id: 'a-3', japanese: 'LOW', hiragana: 'ろう', english: 'low' },  // 0/3
      ],
    };
    const table = {
      'a-1': { success: 0, failure: 0, difficult: false },
      'a-2': { success: 3, failure: 0, difficult: false },
      'a-3': { success: 0, failure: 3, difficult: false },
    } as any;
    window.localStorage.setItem('flashcards:carddata:v1', JSON.stringify(table));
    mockDeckContext(decks);
    render(<Stats />);

    // Ascending: LOW, HIGH, ZERO
    let cards = Array.from(document.querySelectorAll('.card')) as HTMLElement[];
    expect(cards[0].textContent || '').toMatch(/LOW|ろう|low/i);
    expect(cards[1].textContent || '').toMatch(/HIGH|はい|high/i);
    expect(cards[2].textContent || '').toMatch(/ZERO|ぜろ|zero/i);

    // Descending: HIGH, LOW, ZERO
    const orderToggle = screen.getByLabelText(/Ascending|Descending/i);
    fireEvent.click(orderToggle);
    cards = Array.from(document.querySelectorAll('.card')) as HTMLElement[];
    expect(cards[0].textContent || '').toMatch(/HIGH|はい|high/i);
    expect(cards[1].textContent || '').toMatch(/LOW|ろう|low/i);
    expect(cards[2].textContent || '').toMatch(/ZERO|ぜろ|zero/i);
  });
});
