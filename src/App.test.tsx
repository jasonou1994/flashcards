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
    expect(screen.getByRole('heading', { name: /Japanese Flashcards/i })).toBeInTheDocument();
    // Active tab should be Study
    const studyTab = screen.getByRole('link', { name: /Study/i });
    expect(studyTab).toHaveClass('active');
  });

  it('deep-links to /stats and shows Stats UI', () => {
    renderTestApp('/stats');
    expect(screen.getByRole('heading', { name: /Stats/i })).toBeInTheDocument();
    const statsTab = screen.getByRole('link', { name: /Stats/i });
    expect(statsTab).toHaveClass('active');
    // Study heading should be absent
    expect(screen.queryByRole('heading', { name: /Japanese Flashcards/i })).toBeNull();
  });

  it('unknown route redirects to /study', () => {
    renderTestApp('/nope');
    expect(screen.getByRole('heading', { name: /Japanese Flashcards/i })).toBeInTheDocument();
  });

  it('clicking tabs navigates between routes', () => {
    renderTestApp('/study');
    const statsLink = screen.getByRole('link', { name: /Stats/i });
    fireEvent.click(statsLink);
    expect(screen.getByRole('heading', { name: /Stats/i })).toBeInTheDocument();
    const studyLink = screen.getByRole('link', { name: /Study/i });
    fireEvent.click(studyLink);
    expect(screen.getByRole('heading', { name: /Japanese Flashcards/i })).toBeInTheDocument();
  });
});

