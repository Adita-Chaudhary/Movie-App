import '../css/Skeleton.css';

/** Placeholder matching MovieCard's dimensions, shown while a list is loading. */
function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-poster" />
      <div className="skeleton skeleton-line" style={{ width: '80%' }} />
      <div className="skeleton skeleton-line" style={{ width: '40%' }} />
    </div>
  );
}

export function SkeletonRow({ count = 6 }) {
  return (
    <div className="skeleton-row" role="status" aria-label="Loading movies">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default SkeletonCard;
