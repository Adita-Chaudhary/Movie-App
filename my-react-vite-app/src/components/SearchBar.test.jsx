import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SearchBar from './SearchBar';
import { clearCache } from '../services/cache';

function moviePage(titles) {
  return {
    page: 1,
    total_pages: 1,
    results: titles.map((title, i) => ({
      id: 100 + i,
      title,
      release_date: '2005-06-15',
      poster_path: null,
      genre_ids: [],
      overview: '',
    })),
  };
}

function mockSearchFetch(responder) {
  return vi.fn(
    (url, init) =>
      new Promise((resolve, reject) => {
        const rejectAsAborted = () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        };
        if (init?.signal) {
          if (init.signal.aborted) return rejectAsAborted();
          init.signal.addEventListener('abort', rejectAsAborted);
        }
        Promise.resolve().then(() => resolve({ ok: true, json: async () => responder(url.toString()) }));
      })
  );
}

function renderSearchBar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<SearchBar />} />
        <Route path="/movie/:id" element={<div>Movie Details Page</div>} />
        <Route path="/search" element={<div>Search Results Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SearchBar autocomplete', () => {
  beforeEach(() => {
    clearCache();
  });

  it('does not show suggestions before 2 characters', async () => {
    globalThis.fetch = mockSearchFetch(() => moviePage(['Batman Begins']));
    const user = userEvent.setup();
    renderSearchBar();

    await user.type(screen.getByLabelText('Search for movies'), 'b');

    // Give any accidental request/debounce timer a chance to resolve,
    // then confirm nothing rendered - wrapped in act() so the debounce
    // hook's timer-driven state update is properly flushed.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 350));
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('debounces - does not fire a request per keystroke', async () => {
    const fetchMock = mockSearchFetch(() => moviePage(['Batman Begins']));
    globalThis.fetch = fetchMock;
    const user = userEvent.setup();
    renderSearchBar();

    await user.type(screen.getByLabelText('Search for movies'), 'batman');

    await waitFor(() => expect(screen.getByRole('option', { name: /batman begins/i })).toBeInTheDocument());

    // 6 keystrokes should not mean 6 requests.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state, then results with poster + year', async () => {
    globalThis.fetch = mockSearchFetch(() => moviePage(['Batman Begins']));
    const user = userEvent.setup();
    renderSearchBar();

    await user.type(screen.getByLabelText('Search for movies'), 'bat');

    await waitFor(() => expect(screen.getByRole('option', { name: /batman begins/i })).toBeInTheDocument());
    expect(screen.getByText('2005')).toBeInTheDocument();
  });

  it('shows a no-results state', async () => {
    globalThis.fetch = mockSearchFetch(() => moviePage([]));
    const user = userEvent.setup();
    renderSearchBar();

    await user.type(screen.getByLabelText('Search for movies'), 'zzzzz');

    await waitFor(() => expect(screen.getByText(/no movies found/i)).toBeInTheDocument());
  });

  it('shows an error state on request failure', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('network down')));
    const user = userEvent.setup();
    renderSearchBar();

    await user.type(screen.getByLabelText('Search for movies'), 'bat');

    await waitFor(() => expect(screen.getByText(/couldn't load suggestions/i)).toBeInTheDocument());
  });

  it('supports arrow-key navigation and Enter to select the highlighted suggestion', async () => {
    globalThis.fetch = mockSearchFetch(() => moviePage(['Batman Begins', 'The Batman', 'Batman Returns']));
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByLabelText('Search for movies');
    await user.type(input, 'bat');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));

    await user.keyboard('{ArrowDown}{ArrowDown}'); // highlight the 2nd option ("The Batman", id 101)
    await user.keyboard('{Enter}');

    await waitFor(() => expect(screen.getByText('Movie Details Page')).toBeInTheDocument());
  });

  it('Escape closes the dropdown', async () => {
    globalThis.fetch = mockSearchFetch(() => moviePage(['Batman Begins']));
    const user = userEvent.setup();
    renderSearchBar();

    await user.type(screen.getByLabelText('Search for movies'), 'bat');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('closes when clicking outside', async () => {
    globalThis.fetch = mockSearchFetch(() => moviePage(['Batman Begins']));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <div>
          <SearchBar />
          <button type="button">Elsewhere on the page</button>
        </div>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Search for movies'), 'bat');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Elsewhere on the page' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('clicking a suggestion navigates to /movie/:id and closes the dropdown', async () => {
    globalThis.fetch = mockSearchFetch(() => moviePage(['Batman Begins']));
    const user = userEvent.setup();
    renderSearchBar();

    await user.type(screen.getByLabelText('Search for movies'), 'bat');
    await waitFor(() => expect(screen.getByRole('option', { name: /batman begins/i })).toBeInTheDocument());

    await user.click(screen.getByRole('option', { name: /batman begins/i }));

    await waitFor(() => expect(screen.getByText('Movie Details Page')).toBeInTheDocument());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('Enter with no suggestion highlighted still performs the normal /search?q= navigation', async () => {
    globalThis.fetch = mockSearchFetch(() => moviePage(['Batman Begins']));
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByLabelText('Search for movies');
    await user.type(input, 'batman{Enter}');

    await waitFor(() => expect(screen.getByText('Search Results Page')).toBeInTheDocument());
  });

  it('exposes combobox ARIA semantics', async () => {
    globalThis.fetch = mockSearchFetch(() => moviePage(['Batman Begins']));
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByLabelText('Search for movies');
    expect(input).toHaveAttribute('role', 'combobox');
    expect(input).toHaveAttribute('aria-expanded', 'false');

    await user.type(input, 'bat');
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'));
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Movie suggestions');
  });
});
