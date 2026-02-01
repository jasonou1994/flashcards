import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';
import type { CardItem } from './utils';

const mockCard = {
  id: 'c-001',
  japanese: '日本',
  hiragana: 'にほん',
  english: 'Japan',
} as any;

describe('Card component actions bar', () => {
  it('renders flag button and counts on front and back', () => {
    const onFlip = jest.fn();
    const onToggleDifficult = jest.fn();

    const { rerender } = render(
      <Card
        card={mockCard}
        flipped={false}
        onFlip={onFlip}
        frontField="japanese"
        counts={{ success: 1, failure: 2 }}
        difficult={false}
        onToggleDifficult={onToggleDifficult}
      />
    );

    expect(screen.getByRole('button', { name: /flag difficult/i })).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Flip to back and ensure actions bar still visible
    rerender(
      <Card
        card={mockCard}
        flipped={true}
        onFlip={onFlip}
        frontField="japanese"
        counts={{ success: 1, failure: 2 }}
        difficult={false}
        onToggleDifficult={onToggleDifficult}
      />
    );

    expect(screen.getByRole('button', { name: /flag difficult/i })).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('clicking flag does not trigger flip', () => {
    const onFlip = jest.fn();
    const onToggleDifficult = jest.fn();

    render(
      <Card
        card={mockCard}
        flipped={false}
        onFlip={onFlip}
        frontField="japanese"
        counts={{ success: 0, failure: 0 }}
        difficult={false}
        onToggleDifficult={onToggleDifficult}
      />
    );

    const flagBtn = screen.getByRole('button', { name: /flag difficult/i });
    fireEvent.click(flagBtn);
    expect(onToggleDifficult).toHaveBeenCalled();
    expect(onFlip).not.toHaveBeenCalled();
  });
});

describe('Card structure', () => {
  const base: CardItem = {
    id: 'test-1',
    japanese: '<ruby>卒業<rt>そつぎょう</rt></ruby>',
    hiragana: 'そつぎょう',
    english: 'graduation',
  } as CardItem;

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
    const card: CardItem = { ...base, id: 'test-2', japanese_example: '<ruby>例<rt>れい</rt></ruby> 文', english_example: 'Example sentence' } as CardItem;
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
