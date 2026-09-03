import { useTheme } from '../contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span key={theme} className="theme-toggle-icon">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  );
}

export default ThemeToggle;
