import React from 'react';
import { render, screen } from '@testing-library/react';
import { HtmlOrText, Card, CardItem } from './App';

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

describe('Card', () => {
  const base: CardItem = {
    japanese: '<ruby>卒業<rt>そつぎょう</rt></ruby>',
    hiragana: 'そつぎょう',
    english: 'graduation',
  };

  it('renders required fields in order', () => {
    const { container } = render(<Card card={base} flipped={false} onFlip={() => {}} />);
    const front = container.querySelector('.side.front');
    const back = container.querySelector('.side.back');
    expect(front).toBeInTheDocument();
    expect(back).toBeInTheDocument();

    const children = Array.from(back!.children);
    expect(children[0]).toHaveClass('hiragana');
    expect(children[1]).toHaveClass('english');
  });

  it('renders optional examples after english in order', () => {
    const card: CardItem = { ...base, japanese_example: '<ruby>例<rt>れい</rt></ruby> 文', english_example: 'Example sentence' };
    const { container } = render(<Card card={card} flipped={true} onFlip={() => {}} />);
    const back = container.querySelector('.side.back');
    const children = Array.from(back!.children);
    expect(children[0]).toHaveClass('hiragana');
    expect(children[1]).toHaveClass('english');
    expect(children[2]).toHaveClass('japanese-example');
    expect(children[3]).toHaveClass('english-example');
  });
});
