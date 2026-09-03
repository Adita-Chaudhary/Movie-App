import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Navigates to /search?q=... as the user types (debounced by SearchPage itself via the URL). */
function SearchBar({ initialValue = '', className = '', autoFocus = false }) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim()) navigate(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className={`flex w-full gap-2 ${className}`} role="search">
      <input
        type="search"
        placeholder="Search for movies..."
        className="min-w-0 flex-1 rounded-md px-3.5 py-2.5 text-[0.95rem] md:py-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search for movies"
        autoFocus={autoFocus}
      />
      <button
        type="submit"
        className="whitespace-nowrap border-brand bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-hover md:py-2"
      >
        Search
      </button>
    </form>
  );
}

export default SearchBar;
