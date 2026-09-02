/** Small, dependency-free display formatters shared across components. */

export function formatYear(dateString) {
  if (!dateString) return 'TBA';
  const year = dateString.split('-')[0];
  return year || 'TBA';
}

export function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRuntime(minutes) {
  if (!minutes || minutes <= 0) return 'Unknown runtime';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatRating(voteAverage) {
  if (typeof voteAverage !== 'number' || Number.isNaN(voteAverage)) return 'N/A';
  return voteAverage.toFixed(1);
}

export function truncate(text, maxLength = 160) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}
