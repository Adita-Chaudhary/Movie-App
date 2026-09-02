import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import '../css/Navbar.css';

function Navbar() {
  const { count } = useWatchlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <Link to="/" className="navbar-brand" onClick={() => setIsMenuOpen(false)}>
          MovieNest
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>

        <div className="navbar-search-desktop">
          <SearchBar className="navbar-search-bar" />
        </div>

        <div className="navbar-actions-desktop">
          <ThemeToggle />
        </div>
      </div>

      <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
        <div className="navbar-search-mobile">
          <SearchBar className="navbar-search-bar" />
        </div>
        <NavLink to="/" end className={linkClass} onClick={() => setIsMenuOpen(false)}>
          Home
        </NavLink>
        <NavLink to="/search" className={linkClass} onClick={() => setIsMenuOpen(false)}>
          Search
        </NavLink>
        <NavLink to="/watchlist" className={linkClass} onClick={() => setIsMenuOpen(false)}>
          Watchlist {count > 0 && <span className="nav-badge">{count}</span>}
        </NavLink>
        <NavLink to="/activity" className={linkClass} onClick={() => setIsMenuOpen(false)}>
          Activity
        </NavLink>
        <div className="navbar-actions-mobile">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
