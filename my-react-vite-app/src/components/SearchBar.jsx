import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SearchBar.css';

/** Navigates to /search?q=... as the user types (debounced by SearchPage itself via the URL). */
function SearchBar({ initialValue = '', className = '', autoFocus = false }) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim()) navigate(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className={`search-bar ${className}`} role="search">
      <input
        type="search"
        placeholder="Search for movies..."
        className="search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search for movies"
        autoFocus={autoFocus}
      />
      <button type="submit" className="search-button">
        Search
      </button>
    </form>
  );
}

export default SearchBar;
