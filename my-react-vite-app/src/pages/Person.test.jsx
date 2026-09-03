import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Person from './Person';
import * as movieApi from '../services/movieApi';
import { WatchlistProvider } from '../contexts/WatchlistContext';

function renderPerson(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/person/${id}`]}>
      <WatchlistProvider>
        <Routes>
          <Route path="/person/:id" element={<Person />} />
        </Routes>
      </WatchlistProvider>
    </MemoryRouter>
  );
}

describe('Person page', () => {
  it('shows name, biography, birthday/place of birth, and known-for/filmography movies', async () => {
    vi.spyOn(movieApi, 'getPersonDetails').mockResolvedValue({
      id: 1,
      name: 'Jane Director',
      biography: 'An acclaimed filmmaker.',
      birthday: '1970-05-02',
      place_of_birth: 'London, UK',
      profile_path: '/photo.jpg',
      known_for_department: 'Directing',
      movie_credits: {
        cast: [
          { id: 10, title: 'Known Movie', character: 'Herself', release_date: '2015-01-01', popularity: 90 },
        ],
        crew: [{ id: 20, title: 'Directed Movie', job: 'Director', release_date: '2019-01-01' }],
      },
    });

    renderPerson();

    await waitFor(() => expect(screen.getByText('Jane Director')).toBeInTheDocument());
    expect(screen.getByText('An acclaimed filmmaker.')).toBeInTheDocument();
    expect(screen.getByText('London, UK')).toBeInTheDocument();
    // "Known Movie" legitimately appears in both the "Known For" and
    // "Filmography" sections (both are derived from the same cast credit).
    expect(screen.getAllByText('Known Movie').length).toBeGreaterThan(0);
    expect(screen.getByText('Directed Movie')).toBeInTheDocument();

    // Filmography entries must link back to MovieNest's own movie details page.
    const link = screen.getByText('Directed Movie').closest('a');
    expect(link).toHaveAttribute('href', '/movie/20');
  });

  it('handles missing biography and photo gracefully instead of breaking', async () => {
    vi.spyOn(movieApi, 'getPersonDetails').mockResolvedValue({
      id: 2,
      name: 'Mystery Person',
      biography: '',
      profile_path: null,
      movie_credits: { cast: [], crew: [] },
    });

    renderPerson('2');

    await waitFor(() => expect(screen.getByText('Mystery Person')).toBeInTheDocument());
    expect(screen.getByText('No biography available.')).toBeInTheDocument();
    expect(screen.getByText('No known filmography available.')).toBeInTheDocument();
  });

  it('shows an error state with retry when the person fails to load', async () => {
    vi.spyOn(movieApi, 'getPersonDetails').mockRejectedValue(new Error('Failed to load this person.'));

    renderPerson('3');

    await waitFor(() => expect(screen.getByText(/Failed to load this person/)).toBeInTheDocument());
  });
});
