import { useState } from 'react';
import StarRating from './StarRating';
import Button from './Button';

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
    <form className="flex flex-col gap-3 rounded-[10px] bg-panel p-5" onSubmit={handleSubmit}>
      <div>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <textarea
        className="w-full resize-y rounded-md p-3 text-sm"
        placeholder="Write a short review (optional)"
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={1000}
        rows={3}
      />
      <div className="flex gap-3">
        <Button type="submit" disabled={rating === 0}>
          {existing ? 'Update Rating' : 'Save Rating'}
        </Button>
        {existing && (
          <Button type="button" variant="danger" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}

export default RatingReviewForm;
