import { useMemo } from 'react';
import { useWatchProviders } from '../hooks/useWatchProviders';
import { useAvailableRegions } from '../hooks/useAvailableRegions';
import { useRegion } from '../hooks/useRegion';
import { withCurrentRegionOption } from '../utils/region';
import { tmdbImage } from '../services/tmdbClient';
import { getProviderUrl } from '../utils/watchProviders';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

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
    <section className="fade-in-up mx-auto mb-8 max-w-[1200px] rounded-xl bg-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Where to Watch</h2>
        {regionOptions.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            Region
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="max-w-[200px] rounded-md px-2.5 py-1.5 text-sm transition-shadow duration-200 focus:ring-4 focus:ring-brand/15"
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

      {isError && <p className="text-bad">⚠ {error}</p>}

      {!isLoading && !isError && (
        <>
          {hasAnyProviders ? (
            <div>
              {CATEGORIES.map(({ key, label }) => {
                const providers = regionData[key];
                if (!providers || providers.length === 0) return null;
                return (
                  <div className="mb-4 last:mb-0" key={key}>
                    <h3 className="mb-2.5 text-xs uppercase tracking-wide text-ink-muted">{label}</h3>
                    <div className="flex flex-wrap gap-3">
                      {providers.map((provider) => {
                        const logoUrl = tmdbImage(provider.logo_path, 'w92');
                        const providerUrl = getProviderUrl(provider);

                        const logo = logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={provider.provider_name}
                            loading="lazy"
                            className="block h-full w-full object-cover transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110"
                          />
                        ) : (
                          <span className="p-1 text-center text-[0.55rem] leading-tight text-ink-muted">
                            {provider.provider_name}
                          </span>
                        );

                        // Only ever rendered as a link when TMDB actually
                        // supplied a URL for this specific provider (see
                        // utils/watchProviders.js) - never a fabricated
                        // one built from the provider's name/id.
                        if (providerUrl) {
                          return (
                            <a
                              key={provider.provider_id}
                              href={providerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Open ${provider.provider_name}`}
                              aria-label={`Open ${provider.provider_name} (opens in a new tab)`}
                              className="group relative flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-panel-raised ring-1 ring-line transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:scale-[1.06] hover:shadow-panel hover:ring-brand focus-visible:-translate-y-1 focus-visible:scale-[1.06] focus-visible:ring-brand active:translate-y-0 active:scale-[0.96]"
                            >
                              {logo}
                              <span className="pointer-events-none absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/70 text-[0.5rem] leading-none text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                                ↗
                              </span>
                            </a>
                          );
                        }

                        return (
                          <div
                            key={provider.provider_id}
                            title={provider.provider_name}
                            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-panel-raised opacity-90"
                          >
                            {logo}
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
        </>
      )}
    </section>
  );
}

export default WhereToWatch;
