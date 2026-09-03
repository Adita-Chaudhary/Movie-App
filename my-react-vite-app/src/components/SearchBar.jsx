import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useMovieSuggestions } from '../hooks/useMovieSuggestions';
import SearchSuggestions from './SearchSuggestions';

/**
 * Navigates to /search?q=... on submit (unchanged), plus a movie
 * suggestions dropdown while typing (see useMovieSuggestions.js). The
 * dropdown never intercepts a plain Enter/Search-button submit unless
 * the user has actually arrow-key-highlighted a suggestion first, so the
 * original "type and hit enter to search" behavior is preserved exactly.
 */
function SearchBar({ initialValue = '', className = '', autoFocus = false }) {
  const [value, setValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const { suggestions, status, isEligible } = useMovieSuggestions(value);
  const showDropdown = isOpen && isEligible;

  // A fresh suggestion list shouldn't keep a stale highlight from the
  // previous query around.
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Rendered through a portal (see SearchSuggestions.jsx) with `position:
  // fixed` coordinates computed from the input's own box, rather than as
  // a plain absolutely-positioned child - the mobile nav menu that wraps
  // one of the two SearchBar instances uses `overflow-hidden` for its
  // height-collapse animation, which would otherwise clip the dropdown.
  useEffect(() => {
    if (!showDropdown) return undefined;
    function updatePosition() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownStyle({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [showDropdown]);

  // Supplements the focusout/relatedTarget handling below: clicking on
  // non-focusable page content (plain text, a poster image that isn't a
  // link, empty padding, ...) never moves focus at all, so no focusout
  // event would fire there. This catches that case. Note the dropdown
  // itself now lives in a portal outside containerRef, so it's checked
  // separately via its own DOM id.
  useEffect(() => {
    if (!showDropdown) return undefined;
    function handlePointerDown(e) {
      const insideControl = containerRef.current?.contains(e.target);
      const insideDropdown = document.getElementById('search-suggestions-listbox')?.contains(e.target);
      if (!insideControl && !insideDropdown) setIsOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showDropdown]);

  function goToMovie(movie) {
    setIsOpen(false);
    navigate(`/movie/${movie.id}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (showDropdown && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      goToMovie(suggestions[highlightedIndex]);
      return;
    }
    setIsOpen(false);
    if (value.trim()) navigate(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
    // Enter is handled by the form's onSubmit above.
  }

  const highlightedMovie = highlightedIndex >= 0 ? suggestions[highlightedIndex] : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      // focusout (React's onBlur) bubbles from any descendant, so this
      // fires whenever focus leaves the input/button group - checking
      // relatedTarget (where focus is *going*) avoids closing the
      // dropdown just because focus moved from the input to the Search
      // button, while still closing it when focus leaves entirely (e.g.
      // Tab to the nav links). The suggestions render through a portal
      // into document.body (see the effect above), so they're NOT a DOM
      // descendant of this container even though they're logically part
      // of it - contains() alone would say focus "left", closing the
      // dropdown (unmounting the portal) before a click on a suggestion
      // ever gets to fire. Also allow relatedTarget landing inside the
      // portaled listbox.
      onBlur={(e) => {
        const stillInside =
          e.currentTarget.contains(e.relatedTarget) ||
          document.getElementById('search-suggestions-listbox')?.contains(e.relatedTarget);
        if (!stillInside) setIsOpen(false);
      }}
    >
      <form onSubmit={handleSubmit} className="flex w-full gap-2" role="search">
        <input
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions-listbox"
          aria-autocomplete="list"
          aria-activedescendant={highlightedMovie ? `search-suggestion-${highlightedMovie.id}` : undefined}
          placeholder="Search for movies..."
          className="min-w-0 flex-1 rounded-md px-3.5 py-2.5 text-[0.95rem] transition-shadow duration-200 focus:ring-4 focus:ring-brand/15 md:py-2"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search for movies"
          autoComplete="off"
          autoFocus={autoFocus}
        />
        <button
          type="submit"
          className="whitespace-nowrap border-brand bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-hover md:py-2"
        >
          Search
        </button>
      </form>

      {showDropdown &&
        dropdownStyle &&
        createPortal(
          <SearchSuggestions
            suggestions={suggestions}
            status={status}
            query={value.trim()}
            highlightedIndex={highlightedIndex}
            onHover={setHighlightedIndex}
            onSelect={goToMovie}
            style={dropdownStyle}
          />,
          document.body
        )}
    </div>
  );
}

export default SearchBar;
