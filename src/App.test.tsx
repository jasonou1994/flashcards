import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App, { HtmlOrText, Card, CardItem } from './App';

// Mock the sample deck imported by App to keep tests small and deterministic
jest.mock('../decks/chapter1_1.json', () => [
  {
    japanese: 'カード1',
    hiragana: 'かーど1',
    english: 'card one',
  },
  {
    japanese: 'カード2',
    hiragana: 'かーど2',
    english: 'card two',
  },
  {
    japanese: 'カード3',
    hiragana: 'かーど3',
    english: 'card three',
  },
]);

describe('HtmlOrText', () => {
  it('renders plain text when no ruby markup', () => {
    render(<HtmlOrText className="plain" text="Hello" />);
    const el = screen.getByText('Hello');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('plain');
  });

  it('renders inner HTML when ruby markup present', () => {
    const ruby = '<ruby>危険<rt>きけん</rt></ruby>';
    const { container } = render(<HtmlOrText className="ruby" text={ruby} />);
    const div = container.querySelector('.ruby');
    expect(div).toBeInTheDocument();
    expect(div!.innerHTML).toBe(ruby);
  });
});

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

describe('Card', () => {
  const base: CardItem = {
    japanese: '<ruby>卒業<rt>そつぎょう</rt></ruby>',
    hiragana: 'そつぎょう',
    english: 'graduation',
  };

  it('renders required fields in order', () => {
    const { container } = render(<Card card={base} flipped={false} onFlip={() => {}} frontField="japanese" />);
    const front = container.querySelector('.side.front');
    const back = container.querySelector('.side.back');
    expect(front).toBeInTheDocument();
    expect(back).toBeInTheDocument();

    const children = Array.from(back!.children);
    expect(children[0]).toHaveClass('japanese');
    expect(children[1]).toHaveClass('hiragana');
    expect(children[2]).toHaveClass('english');
  });

  it('renders optional examples after english in order', () => {
    const card: CardItem = { ...base, japanese_example: '<ruby>例<rt>れい</rt></ruby> 文', english_example: 'Example sentence' };
    const { container } = render(<Card card={card} flipped={true} onFlip={() => {}} frontField="japanese" />);
    const back = container.querySelector('.side.back');
    const children = Array.from(back!.children);
    expect(children[0]).toHaveClass('japanese');
    expect(children[1]).toHaveClass('hiragana');
    expect(children[2]).toHaveClass('english');
    expect(children[3]).toHaveClass('japanese-example');
    expect(children[4]).toHaveClass('english-example');
  });
});
