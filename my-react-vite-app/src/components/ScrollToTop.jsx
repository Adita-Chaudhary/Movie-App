import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Resets scroll position on every route change (React Router doesn't do this by default). */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
