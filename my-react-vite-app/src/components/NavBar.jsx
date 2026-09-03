import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';

const NAV_LINK_BASE =
  "relative inline-flex w-full items-center gap-1.5 rounded-md px-4 py-2.5 text-sm transition-colors duration-200 after:absolute after:bottom-[3px] after:left-4 after:right-4 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-brand after:transition-transform after:duration-250 after:content-[''] hover:bg-panel md:w-auto md:py-2";

function Navbar() {
  const { count } = useWatchlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `${NAV_LINK_BASE} ${isActive ? 'bg-panel-raised font-semibold text-brand after:scale-x-100' : ''}`;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-canvas px-4 py-3 md:px-8 md:py-3.5">
      <div className="flex items-center gap-4 md:gap-6">
        <Link
          to="/"
          className="fade-in inline-block whitespace-nowrap text-xl font-extrabold text-brand transition-transform duration-200 hover:scale-105 md:text-2xl"
          onClick={closeMenu}
        >
          MovieNest
        </Link>

        <button
          type="button"
          className="ml-auto block p-1.5 text-2xl md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>

        <div className="hidden max-w-[420px] flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto hidden md:block">
          <ThemeToggle />
        </div>
      </div>

      <div
        className={`flex flex-col items-stretch gap-1 overflow-hidden transition-[max-height,margin-top] duration-300 ease-in-out md:mt-0 md:max-h-none md:flex-row md:items-center md:gap-1 md:overflow-visible ${
          isMenuOpen ? 'mt-3 max-h-[500px]' : 'mt-0 max-h-0'
        }`}
      >
        <div className="mb-2 block md:hidden">
          <SearchBar />
        </div>
        <NavLink to="/" end className={linkClass} onClick={closeMenu}>
          Home
        </NavLink>
        <NavLink to="/search" className={linkClass} onClick={closeMenu}>
          Search
        </NavLink>
        <NavLink to="/watchlist" className={linkClass} onClick={closeMenu}>
          Watchlist{' '}
          {count > 0 && (
            // Keyed on `count` so the pop animation actually replays every
            // time the count changes, not just the first time the badge
            // mounts (a static className never restarts a CSS animation on
            // an element that's already in the DOM).
            <span
              key={count}
              className="animate-[pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)] rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white"
            >
              {count}
            </span>
          )}
        </NavLink>
        <NavLink to="/activity" className={linkClass} onClick={closeMenu}>
          Activity
        </NavLink>
        <div className="mt-2 block md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
