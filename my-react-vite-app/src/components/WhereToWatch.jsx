import { useMemo } from 'react';
import { useWatchProviders } from '../hooks/useWatchProviders';
import { useAvailableRegions } from '../hooks/useAvailableRegions';
import { useRegion } from '../hooks/useRegion';
import { withCurrentRegionOption } from '../utils/region';
import { tmdbImage } from '../services/tmdbClient';
import Spinner from './Spinner';
import EmptyState from './EmptyState';
import '../css/WhereToWatch.css';

// Order matters: streaming/free options are usually more relevant to a
// user than pay options, so they're surfaced first.
const CATEGORIES = [
  { key: 'flatrate', label: 'Stream' },
  { key: 'free', label: 'Free' },
  { key: 'ads', label: 'Free with Ads' },
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
];

function WhereToWatch({ movieId }) {
  const { providersByRegion, isLoading, isError, error } = useWatchProviders(movieId);
  const availableRegions = useAvailableRegions();
  const [region, setRegion] = useRegion();

  const regionOptions = useMemo(() => {
    // Prefer TMDB's official region list; if it hasn't loaded yet, fall
    // back to whichever regions this specific movie has data for, so the
    // selector still shows something rather than being empty.
    const base =
      availableRegions.length > 0
        ? availableRegions
        : Object.keys(providersByRegion ?? {}).map((code) => ({ iso_3166_1: code, english_name: code }));
    return withCurrentRegionOption(base, region);
  }, [availableRegions, providersByRegion, region]);

  const regionData = providersByRegion?.[region];
  const hasAnyProviders = Boolean(regionData) && CATEGORIES.some(({ key }) => regionData[key]?.length > 0);

  return (
    <section className="where-to-watch fade-in-up">
      <div className="where-to-watch-header">
        <h2>Where to Watch</h2>
        {regionOptions.length > 0 && (
          <label className="region-select-label">
            Region
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="region-select"
              aria-label="Select region for watch availability"
            >
              {regionOptions.map((r) => (
                <option key={r.iso_3166_1} value={r.iso_3166_1}>
                  {r.english_name ?? r.iso_3166_1}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {isLoading && <Spinner label="Loading watch options" />}

      {isError && <p className="where-to-watch-error">⚠ {error}</p>}

      {!isLoading && !isError && (
        <>
          {hasAnyProviders ? (
            <div className="where-to-watch-body">
              {CATEGORIES.map(({ key, label }) => {
                const providers = regionData[key];
                if (!providers || providers.length === 0) return null;
                return (
                  <div className="provider-category" key={key}>
                    <h3>{label}</h3>
                    <div className="provider-list">
                      {providers.map((provider) => {
                        const logoUrl = tmdbImage(provider.logo_path, 'w92');
                        return (
                          <div className="provider-badge" key={provider.provider_id} title={provider.provider_name}>
                            {logoUrl ? (
                              <img src={logoUrl} alt={provider.provider_name} loading="lazy" />
                            ) : (
                              <span className="provider-badge-fallback">{provider.provider_name}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="📺"
              title="No streaming options found for this region"
              message="Availability varies by region - try switching the region above."
            />
          )}

          {regionData?.link && (
            <a href={regionData.link} target="_blank" rel="noopener noreferrer" className="where-to-watch-link">
              View Watch Options on TMDB ↗
            </a>
          )}
        </>
      )}

      {/* Required attribution for TMDB/JustWatch watch-provider data. */}
      <p className="where-to-watch-attribution">Watch provider data provided by JustWatch.</p>
    </section>
  );
}

export default WhereToWatch;
