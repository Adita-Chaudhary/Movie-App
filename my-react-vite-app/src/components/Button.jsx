import { Link } from 'react-router-dom';

const BASE =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200';

const VARIANTS = {
  primary: 'border border-brand bg-brand text-white hover:border-brand-hover hover:bg-brand-hover',
  danger: 'border border-bad bg-transparent text-bad hover:bg-bad/10',
  // Relies on the plain global `button` element styling in index.css
  // (panel-raised background, accent hover border) - no color utilities
  // of its own, for a neutral "secondary action" look.
  neutral: 'border border-transparent',
};

/**
 * Small shared call-to-action, used as either a router Link (pass `to`)
 * or a real button (pass `onClick`) - the same "Browse Movies" / "Try
 * again" pattern repeated across empty states, error states, and 404.
 */
function Button({ to, variant = 'primary', type = 'button', className = '', children, ...props }) {
  // Disabled look/cursor comes from the global `button:disabled` base rule
  // (index.css) - consistent across every button in the app for free.
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;
