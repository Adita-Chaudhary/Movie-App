import { useState } from 'react';

const STAR_VALUES = [1, 2, 3, 4, 5];

// Interactive star buttons render a size step larger than plain
// read-only display stars, for a comfortable click/tap target.
const SIZES = {
  sm: { display: 'text-xs', button: 'text-sm' },
  md: { display: 'text-base', button: 'text-xl' },
  lg: { display: 'text-2xl', button: 'text-3xl' },
};

/**
 * 1-5 star rating control. Read-only mode renders plain stars for
 * display (e.g. on a review card); interactive mode is keyboard- and
 * screen-reader-accessible via a radiogroup of buttons.
 */
function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;
  const sizeClasses = SIZES[size];

  if (readOnly) {
    return (
      <div className="inline-flex gap-1" aria-label={`Rated ${value} out of 5`}>
        {STAR_VALUES.map((star) => (
          <span
            key={star}
            className={`${sizeClasses.display} ${star <= value ? 'text-gold' : 'text-line'}`}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className="inline-flex gap-1"
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
          className={`border-0 bg-transparent p-[0.1rem] leading-none transition-[transform,color] duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-rotate-[4deg] hover:scale-125 focus-visible:-rotate-[4deg] focus-visible:scale-125 focus-visible:outline-offset-1 active:scale-95 ${sizeClasses.button} ${
            star <= displayValue ? 'text-gold' : 'text-line'
          }`}
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
