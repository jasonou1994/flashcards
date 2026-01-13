import React from 'react';
import { render, screen } from '@testing-library/react';
import { HtmlOrText } from '../App';

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
