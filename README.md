# 🎬 MovieNest

> A personalized movie discovery platform built with React, TMDB, and a content-based recommendation engine.

MovieNest helps users discover movies based on their interests, ratings, and viewing activity. Instead of only showing popular movies, it builds a lightweight understanding of the user's taste and uses that profile to generate personalized and explainable recommendations.

The application also provides movie details, watchlists, ratings and reviews, viewing history, actor/director exploration, movie similarity, movie-night recommendations, and region-aware streaming availability.

---

## ✨ Features

### 🎯 Personalized Recommendations

MovieNest uses a content-based recommendation engine to rank movies according to the user's activity and preferences.

The recommendation engine considers:

- Genres
- Keywords
- Overview/text similarity
- Cast
- Director
- Movie quality/rating

Recommendations are generated locally from the user's activity without requiring a separate machine-learning backend.

### 💡 Explainable Recommendations

MovieNest doesn't just recommend a movie — it can explain why.

Each personalized recommendation has an associated explanation based on the signals that actually matched the user's preferences.

For example:

> Recommended because you frequently enjoy Crime and Drama movies.

The explanation is available through the compact **Why** interaction on recommendation cards.

---

### 🧬 Movie DNA

MovieNest builds a lightweight profile of the user's movie taste from their activity.

It can surface:

- Top genres
- Average rating
- Recurring keywords
- Favorite directors
- Frequently appearing cast members

The profile evolves as the user watches and rates more movies.

---

### 🎬 Movie Details

Each movie has a dedicated details page containing:

- Backdrop and poster
- Release date
- Runtime
- Genres
- Rating
- Overview
- Director
- Keywords
- Cast
- Personal rating
- Review
- Similar movies
- Personalized recommendations
- Where to Watch

---

### 🔎 Smart Movie Search

Search includes:

- Debounced search
- Autocomplete suggestions
- Movie posters
- Release years
- Keyboard navigation
- Search filters
- Genre filtering
- Year filtering
- Minimum rating
- Sorting
- Infinite scrolling

Autocomplete suggestions appear while typing and can take the user directly to a movie's details page.

---

### 📺 Where to Watch

MovieNest uses TMDB's region-specific watch-provider data to show where a movie is available.

Supported categories include:

- Stream
- Free
- Free with Ads
- Rent
- Buy

Users can change their region to see relevant availability.

Provider tiles can link to the corresponding official streaming service when a verified provider URL is available.

---

### ❤️ Watchlist

Users can maintain a personal watchlist using browser storage.

Features include:

- Add/remove movies
- Persistent watchlist
- Responsive movie grid
- Mobile-friendly controls

No account is required.

---

### ⭐ Ratings & Reviews

Users can give movies a personal rating from:

**1–5 stars**

They can also write a short personal review.

Ratings and reviews are stored locally and can be edited or deleted later.

---

### 🕘 Activity & History

MovieNest keeps track of recently viewed movies and personal ratings.

The Activity page includes:

- Recently Viewed
- My Ratings
- Rating editing
- Rating deletion
- Clear History

---

### 👤 Actor & Director Explorer

Cast members and directors can be explored directly from movie details.

Person pages include:

- Profile image
- Biography
- Birthday
- Birthplace
- Known For
- Filmography
- Acting credits
- Directing credits

Movies in a person's filmography link back to their Movie Details page.

---

### 🎥 Similar Movies

MovieNest combines TMDB's similarity/recommendation data with its own content-based scoring.

The system:

1. Retrieves TMDB similar/recommended movies
2. Combines the candidate lists
3. Removes duplicates
4. Excludes the current movie
5. Re-ranks candidates using MovieNest's scoring system
6. Boosts movies supported by multiple recommendation sources

This produces a more meaningful Similar Movies section instead of simply displaying a raw API list.

---

### 🍿 Movie Night

MovieNest includes a lightweight double-feature generator that finds two movies that work well together.

It uses the existing recommendation ranking rather than requiring another expensive recommendation pass.

---

## 🧠 Recommendation System

One of the main engineering features of MovieNest is its content-based recommendation engine.

### Recommendation signals

| Signal | Weight |
|---|---:|
| Genre similarity | 30% |
| Keyword similarity | 20% |
| Overview/text similarity | 20% |
| Cast similarity | 10% |
| Director similarity | 10% |
| Quality | 10% |

The weights are normalized when a candidate doesn't contain enough metadata, preventing incomplete API objects from being unfairly penalized.

### Two-stage ranking

To reduce unnecessary API requests, MovieNest uses a two-stage approach:

```text
User Activity
      ↓
Build Taste Profile
      ↓
Cheap Candidate Ranking
(genre + text + quality)
      ↓
Top Candidate Shortlist
      ↓
Fetch / reuse richer movie metadata
      ↓
Final Ranking
(genre + keywords + text + cast + director + quality)
      ↓
Personalized Recommendations
      ↓
Explain Recommendation
