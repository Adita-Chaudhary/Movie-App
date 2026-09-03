import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
  it('discloses TMDB API usage with a link to themoviedb.org', () => {
    render(<Footer />);

    const tmdbLink = screen.getByRole('link', { name: /tmdb/i });
    expect(tmdbLink).toHaveAttribute('href', 'https://www.themoviedb.org/');
    expect(tmdbLink).toHaveAttribute('target', '_blank');
    expect(tmdbLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('states the app is not endorsed or certified by TMDB', () => {
    render(<Footer />);
    expect(screen.getByText(/not endorsed or certified by tmdb/i)).toBeInTheDocument();
  });

  it('attributes watch provider data to JustWatch', () => {
    render(<Footer />);
    expect(screen.getByText(/provided by justwatch/i)).toBeInTheDocument();
  });
});
