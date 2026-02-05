import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './NavBar';
import Study from './Study';
import Stats from './Stats';

describe('App routing', () => {
  function renderTestApp(initial: string) {
    render(
      <MemoryRouter initialEntries={[initial]}>
        <NavBar />
        <Routes>
          <Route path="/study" element={<Study />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/" element={<Navigate to="/study" replace />} />
          <Route path="*" element={<Navigate to="/study" replace />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('redirects / to /study and shows Study UI', () => {
    renderTestApp('/');
    expect(screen.getByRole('heading', { name: /Decks/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Select a deck to begin/i })).toBeInTheDocument();
    // Active tab should be Study
    const studyTab = screen.getByRole('tab', { name: /Study/i });
    expect(studyTab).toHaveAttribute('aria-selected', 'true');
  });

  it('deep-links to /stats and shows Stats UI', () => {
    renderTestApp('/stats');
    expect(screen.getByRole('heading', { name: /Stats/i })).toBeInTheDocument();
    const statsTab = screen.getByRole('tab', { name: /Stats/i });
    expect(statsTab).toHaveAttribute('aria-selected', 'true');
    // Study-specific controls (e.g., Reshuffle) should be absent
    expect(screen.queryByRole('button', { name: /Reshuffle/i })).toBeNull();
    // Stats has its own deck sidebar
    expect(screen.getByRole('heading', { name: /Decks/i })).toBeInTheDocument();
  });

  it('unknown route redirects to /study', () => {
    renderTestApp('/nope');
    expect(screen.getByRole('heading', { name: /Decks/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Select a deck to begin/i })).toBeInTheDocument();
  });

  it('clicking tabs navigates between routes', () => {
    renderTestApp('/study');
    const statsTab = screen.getByRole('tab', { name: /Stats/i });
    fireEvent.click(statsTab);
    expect(screen.getByRole('heading', { name: /Stats/i })).toBeInTheDocument();
    const studyTab = screen.getByRole('tab', { name: /Study/i });
    fireEvent.click(studyTab);
    expect(screen.getByRole('heading', { name: /Decks/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Select a deck to begin/i })).toBeInTheDocument();
  });
});

