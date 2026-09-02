import { useState } from 'react';
import StarRating from './StarRating';
import '../css/RatingReviewForm.css';

/**
 * Add/edit a personal 1-5 star rating + short review for one movie.
 * `existing` (if present) is the RatingsContext entry being edited.
 */
function RatingReviewForm({ existing, onSave, onDelete }) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [review, setReview] = useState(existing?.review ?? '');

  function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) return;
    onSave({ rating, review: review.trim() });
  }

  return (
    <form className="rating-form" onSubmit={handleSubmit}>
      <div className="rating-form-stars">
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <textarea
        className="rating-form-review"
        placeholder="Write a short review (optional)"
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={1000}
        rows={3}
      />
      <div className="rating-form-actions">
        <button type="submit" className="rating-form-save" disabled={rating === 0}>
          {existing ? 'Update Rating' : 'Save Rating'}
        </button>
        {existing && (
          <button type="button" className="rating-form-delete" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

export default RatingReviewForm;
