import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import Watchlist from './Watchlist';
import { WatchlistProvider } from '../contexts/WatchlistContext';

/**
 * Regression test for a real layout bug: with a single watchlist movie,
 * `.movies-grid`'s CSS grid (`auto-fit`) collapsed to one track and
 * stretched it to fill the whole row, blowing the card up to a
 * full-width, hero-like size. The fix was auto-fill (see MovieGrid.css).
 * jsdom doesn't run real layout, so this can't assert pixel widths -
 * instead it asserts the DOM structure is the same compact-card grid
 * markup regardless of count, and separately guards the CSS source
 * itself so the specific regression can't silently come back.
 */

function seedWatchlist(movies) {
  localStorage.setItem('movienest.watchlist.v1', JSON.stringify(movies));
}

function movie(id) {
  return { id, title: `Movie ${id}`, poster_path: null, release_date: '2024-01-01', vote_average: 7 };
}

function renderWatchlist() {
  return render(
    <MemoryRouter>
      <WatchlistProvider>
        <Watchlist />
      </WatchlistProvider>
    </MemoryRouter>
  );
}

describe('Watchlist page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows an empty state with 0 movies', () => {
    const { container } = renderWatchlist();
    expect(screen.getByText(/watchlist is empty/i)).toBeInTheDocument();
    expect(container.querySelector('.movies-grid')).not.toBeInTheDocument();
    expect(container.querySelector('.movie-card-link')).not.toBeInTheDocument();
  });

  it('renders a single movie inside the same grid container used for many (not a special hero layout)', () => {
    seedWatchlist([movie(1)]);
    const { container } = renderWatchlist();

    const grid = container.querySelector('.movies-grid');
    expect(grid).toBeInTheDocument();
    expect(grid.children).toHaveLength(1);
    expect(screen.getByText('Movie 1')).toBeInTheDocument();
  });

  it('renders two movies in the grid', () => {
    seedWatchlist([movie(1), movie(2)]);
    const { container } = renderWatchlist();

    expect(container.querySelectorAll('.movies-grid > *')).toHaveLength(2);
  });

  it('renders many movies in the grid and shows the correct count', () => {
    const movies = Array.from({ length: 10 }, (_, i) => movie(i + 1));
    seedWatchlist(movies);
    const { container } = renderWatchlist();

    expect(container.querySelectorAll('.movies-grid > *')).toHaveLength(10);
    expect(screen.getByText(/your watchlist \(10\)/i)).toBeInTheDocument();
  });

  it('never regresses to the auto-fit grid that caused the single-card hero bug (jsdom cannot compute real layout, so this guards the CSS source directly)', () => {
    const cssPath = resolve(process.cwd(), 'src/css/MovieGrid.css');
    const css = readFileSync(cssPath, 'utf-8');

    expect(css).toMatch(/grid-template-columns:\s*repeat\(auto-fill,/);
    expect(css).not.toMatch(/grid-template-columns:\s*repeat\(auto-fit,/);
  });
});
