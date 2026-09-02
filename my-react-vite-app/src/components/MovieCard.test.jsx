import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import MovieCard from './MovieCard';
import { WatchlistProvider } from '../contexts/WatchlistContext';

const movie = {
  id: 42,
  title: 'Test Movie',
  poster_path: '/poster.jpg',
  release_date: '2024-05-01',
  vote_average: 8.234,
};

function renderCard() {
  return render(
    <MemoryRouter>
      <WatchlistProvider>
        <MovieCard movie={movie} />
      </WatchlistProvider>
    </MemoryRouter>
  );
}

describe('MovieCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the title, year and rating', () => {
    renderCard();
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('★ 8.2')).toBeInTheDocument();
  });

  it('links to the movie details page', () => {
    renderCard();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/movie/42');
  });

  it('toggles the watchlist button without navigating away', async () => {
    const user = userEvent.setup();
    renderCard();

    const button = screen.getByRole('button', { name: /add test movie to watchlist/i });
    await user.click(button);

    expect(screen.getByRole('button', { name: /remove test movie from watchlist/i })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('movienest.watchlist.v1'))).toHaveLength(1);
  });
});
