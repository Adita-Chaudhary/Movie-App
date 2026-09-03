import '../css/Skeleton.css';

/** Placeholder matching MovieCard's dimensions, shown while a list is loading. */
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="skeleton aspect-[2/3] w-full rounded-lg" />
      <div className="skeleton h-3.5 w-4/5" />
      <div className="skeleton h-3.5 w-2/5" />
    </div>
  );
}

export function SkeletonRow({ count = 6 }) {
  return (
    <div
      className="grid w-full grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-6"
      role="status"
      aria-label="Loading movies"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default SkeletonCard;
