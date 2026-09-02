# MovieNest

A movie discovery app built with React and the TMDB API. Browse trending/popular/top-rated/upcoming titles, search with filters, keep a watchlist and viewing history, rate and review movies, and get content-based recommendations derived from your own activity — all client-side, no backend required.

## Features

- **Movie details** (`/movie/:id`) — backdrop, poster, overview, genres, release date, runtime, rating, director, top cast, keywords, and similar movies, all fetched in a single TMDB request via `append_to_response`.
- **Search** (`/search`) — debounced input, genre/year/min-rating/sort filters, infinite scroll, and dedicated loading/error/empty states. The URL (`?q=`) is kept in sync so searches are shareable/bookmarkable.
- **Watchlist** (`/watchlist`) — add/remove from any movie card or the details page, duplicate-safe, with a live count badge in the nav and a dedicated page with its own empty state.
- **Recently viewed** — every details-page visit is recorded (deduplicated, capped at 30, newest first), with a "Clear History" action, under `/activity`.
- **Personal ratings & reviews** — 1–5 stars plus a short text review per movie, editable and deletable, under `/activity`. Stored in a shape designed to move to a backend later (see [Data & persistence](#data--persistence)).
- **Content-based recommendations** — a homepage "Recommended for You" row generated from your watchlist/ratings/history (see [Recommendation algorithm](#recommendation-algorithm)).
- **Dark/light mode**, responsive layout (mobile nav, horizontal-scroll rows, responsive grid), skeleton loaders, and accessible controls (labeled buttons, keyboard-operable star ratings, focus outlines).

## Tech stack

- **React 18 + Vite 6** — unchanged from the original project.
- **React Router 7** — client-side routing, incl. `useSearchParams` for shareable search state.
- **React Context + hooks** — app state (watchlist, history, ratings, theme), no external state library.
- **Plain CSS with custom properties** — theming via CSS variables, no CSS framework.
- **Vitest + React Testing Library** — unit/component tests.
- **TMDB API** — all movie data.

No backend, no database, no authentication — activity data lives in `localStorage`.

## Getting started

```bash
npm install
cp .env.example .env   # then add your TMDB API key
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_TMDB_API_KEY` | Your TMDB v3 API key. Get a free one at https://www.themoviedb.org/settings/api. |

`.env` is git-ignored; only `.env.example` is committed. The app throws a clear, user-visible error (instead of failing silently) if the key is missing.

> **Note:** an earlier version of this project had a TMDB key committed directly in source. It has since been moved to an environment variable, but because it was previously exposed in git history, it should be rotated from the TMDB dashboard rather than reused.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Architecture

```
src/
  components/     Reusable, presentation-focused UI (MovieCard, MovieRow/Grid, StarRating, ...)
  pages/          Route-level components (Home, Search, MovieDetails, Watchlist, Activity)
  contexts/       App state: WatchlistContext, HistoryContext, RatingsContext, ThemeContext
  hooks/          Reusable logic: useDebounce, useMovieList, useMovieDetails, useRecommendations, ...
  services/       API layer: tmdbClient (fetch/cache/errors), movieApi (endpoint functions)
  utils/          Pure helpers: format.js, storage.js, and the recommendations engine
```

**Separation of concerns:**
- Components never call `fetch` or touch `localStorage` directly — that's the job of `services/` and `contexts/`/`hooks/`.
- `services/tmdbClient.js` centralizes the API key, base URL, error handling, and a small cache; `services/movieApi.js` is the only place that knows TMDB's endpoint shapes.
- Each of watchlist/history/ratings/theme is its own context with a narrow, well-named API (`isInWatchlist`, `addToHistory`, `rateMovie`, ...), composed together in `contexts/AppProviders.jsx`.

**Performance choices:**
- `tmdbClient.js` caches GET responses (5 min TTL, 24h for the rarely-changing genre list) and de-duplicates concurrent identical requests, so re-visiting Home or two components needing the same data don't double-fetch.
- Search input is debounced (400ms) before hitting the network.
- The recommendations row is scored against movies already fetched for the other homepage rows — it costs zero extra API calls.
- Movie posters use `loading="lazy"`; infinite scroll uses `IntersectionObserver` instead of scroll-event listeners.
- In-flight requests are cancelled via `AbortController` when a component unmounts or a search re-fires before the previous one resolves.

## Data & persistence

Watchlist, history, and ratings are stored in `localStorage` under versioned keys (`movienest.watchlist.v1`, etc.) via a small `useLocalStorageState` hook, so persistence logic isn't duplicated per feature. A ratings record looks like:

```js
{ movieId, movie /* snapshot */, rating, review, createdAt, updatedAt }
```

This mirrors what a real backend record would look like (owner-less for now). Moving to a server once authentication exists means swapping the storage layer inside each context (e.g. `rateMovie` calls an API instead of `setState`) — the public hook API (`useRatings()`, `useWatchlist()`, ...) that the rest of the app depends on wouldn't need to change.

The app also migrates the original project's `favorites` localStorage key into the new watchlist on first load, so upgrading doesn't lose existing data.

## Recommendation algorithm

**This is content-based filtering with hand-picked weights, not machine learning.** There's no training data or learned parameters — every recommendation is explainable from a formula you can read in `src/utils/recommendations/`.

1. **Build a taste profile** (`buildProfile.js`) from movies you've watchlisted, rated ≥4 stars, or viewed — each weighted differently (watchlist/high-rating count more than a bare view, since viewing isn't necessarily liking). The profile has two parts:
   - A **genre-weight map**: how strongly each genre shows up across your weighted activity.
   - A **combined term-frequency vector** over the overviews of those same movies.
2. **Score each candidate** (`scoreCandidates.js`) against that profile:
   - **Genre overlap** (55% of the score) — normalized overlap between the candidate's genres and your genre weights.
   - **Overview similarity** (30%) — cosine similarity between term-frequency vectors (`textSimilarity.js`) — classic bag-of-words text similarity, comparing word usage in plot summaries.
   - **Quality/popularity prior** (15%) — a small tie-breaker from `vote_average` and `vote_count`, so it can't dominate the ranking on its own.
3. **Rank and exclude** — candidates already in your watchlist/history/ratings are excluded, the rest are sorted by score, and the top N are returned along with which genres matched (for a "because you liked Action, Sci-Fi" style explanation).

The candidate pool is the set of movies already fetched for the homepage's other rows (trending/popular/top-rated/upcoming) — reusing that data instead of issuing new `/discover` calls keeps this feature free in terms of API usage.

**Why not use cast/keywords too?** TMDB only returns genres and an overview on list endpoints; cast and keywords require a per-movie detail request. Doing that for the whole candidate pool would multiply the number of API calls for every homepage load, so the engine trades that extra signal for staying fast and cache-friendly. The details page does fetch and display keywords/cast/director — a natural next step (see below) would be to feed those into the profile for movies the user has actually opened, since that data is already in hand at that point.

## Testing

`npm test` runs the Vitest suite:

- **Recommendation engine** — tokenization, cosine similarity, profile building, and ranking (including exclusion of already-seen movies and the pure quality-tie-breaker fallback).
- **Watchlist/History/Ratings contexts** — add/remove, duplicate prevention, history's max-size + clear, legacy `favorites` migration, ratings create/update/delete.
- **Components** — `StarRating` (keyboard/click interaction, read-only rendering) and `MovieCard` (rendering, routing link, watchlist toggle).

## Deployment

This is a static SPA (`vite build` → `dist/`), deployable to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.). Set `VITE_TMDB_API_KEY` as an environment variable in the host's build settings — it's inlined at build time, so it must be present during `npm run build`, not just at runtime. Because it's a `VITE_`-prefixed variable it ends up in the client bundle by design (TMDB's v3 API key is meant for client use); don't reuse a TMDB key that has write access or billing significance tied to it.

## Future improvements

- Move watchlist/history/ratings to a real backend once authentication is added (the data shapes already anticipate this).
- Feed cast/director/keywords from the details page into the recommendation profile for movies the user has actually opened.
- Server-side pagination cursor instead of TMDB's page-number model, if the API changes.
- Optional trailer playback on the details page (TMDB exposes this via `append_to_response=videos`, not currently requested).
