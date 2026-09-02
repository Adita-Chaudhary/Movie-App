import { useState } from 'react';
import '../css/StarRating.css';

const STAR_VALUES = [1, 2, 3, 4, 5];

/**
 * 1-5 star rating control. Read-only mode renders plain stars for
 * display (e.g. on a review card); interactive mode is keyboard- and
 * screen-reader-accessible via a radiogroup of buttons.
 */
function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  if (readOnly) {
    return (
      <div className={`star-rating star-rating--${size} star-rating--readonly`} aria-label={`Rated ${value} out of 5`}>
        {STAR_VALUES.map((star) => (
          <span key={star} className={star <= value ? 'star star--filled' : 'star'} aria-hidden="true">
            ★
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`star-rating star-rating--${size}`}
      role="radiogroup"
      aria-label="Rate this movie from 1 to 5 stars"
      onMouseLeave={() => setHoverValue(0)}
    >
      {STAR_VALUES.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={star <= displayValue ? 'star-btn star--filled' : 'star-btn'}
          onMouseEnter={() => setHoverValue(star)}
          onFocus={() => setHoverValue(star)}
          onBlur={() => setHoverValue(0)}
          onClick={() => onChange?.(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default StarRating;
