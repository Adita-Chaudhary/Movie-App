import { ThemeProvider } from './ThemeContext';
import { WatchlistProvider } from './WatchlistContext';
import { HistoryProvider } from './HistoryContext';
import { RatingsProvider } from './RatingsContext';

/** Composes all app-wide providers in one place so App.jsx stays flat. */
export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <WatchlistProvider>
        <HistoryProvider>
          <RatingsProvider>{children}</RatingsProvider>
        </HistoryProvider>
      </WatchlistProvider>
    </ThemeProvider>
  );
}
