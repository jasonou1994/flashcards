import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('renders decks list, random controls, and front-side options', () => {
    const onSelectDeck = jest.fn();
    const onStartRandom = jest.fn();
    const onChangeRandomCount = jest.fn();
    const onTogglePrioritizeDifficult = jest.fn();
    const onChangeFrontField = jest.fn();

    render(
      <Sidebar
        availableDecks={[{ name: 'mock', key: './a.json' }]}
        selectedDeckKey={''}
        onSelectDeck={onSelectDeck}
        onStartRandom={onStartRandom}
        randomCount={30}
        onChangeRandomCount={onChangeRandomCount}
        prioritizeDifficult={false}
        onTogglePrioritizeDifficult={onTogglePrioritizeDifficult}
        frontField={'japanese'}
        onChangeFrontField={onChangeFrontField}
      />
    );

    // Decks header and item
    expect(screen.getByRole('heading', { name: /Decks/i })).toBeInTheDocument();
    const deckButton = screen.getByRole('button', { name: /mock/i });
    expect(deckButton).toBeInTheDocument();

    // Random controls
    expect(screen.getByRole('heading', { name: /Random/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Count/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument();

    // Front side options
    expect(screen.getByRole('radio', { name: /Japanese/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /English/i })).toBeInTheDocument();

    // Interactions: select deck
    fireEvent.click(deckButton);
    expect(onSelectDeck).toHaveBeenCalledWith('./a.json');

    // Change random count
    const countSelect = screen.getByLabelText(/Count/i);
    fireEvent.change(countSelect, { target: { value: '50' } });
    expect(onChangeRandomCount).toHaveBeenCalledWith(50);

    // Toggle prioritize difficult
    const targetErrors = screen.getByRole('checkbox', { name: /Target errors/i });
    fireEvent.click(targetErrors);
    expect(onTogglePrioritizeDifficult).toHaveBeenCalledWith(true);

    // Start random run
    const startBtn = screen.getByRole('button', { name: /Start/i });
    fireEvent.click(startBtn);
    expect(onStartRandom).toHaveBeenCalled();

    // Change front side
    const englishRadio = screen.getByRole('radio', { name: /English/i });
    fireEvent.click(englishRadio);
    expect(onChangeFrontField).toHaveBeenCalledWith('english');
  });
});
