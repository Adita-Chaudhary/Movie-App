import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * A small "i" badge that reveals a compact tooltip on hover/focus/tap.
 * Renders the tooltip through a portal into document.body rather than
 * as a normal absolutely-positioned child: this is meant to be used
 * inside horizontally-scrolling rows (`overflow-x: auto`), and per the
 * CSS overflow spec, setting overflow on one axis makes the *other* axis
 * compute to `auto` too - so a tooltip positioned as a descendant of
 * that scroller would get silently clipped whenever it extended above/
 * below the row. A portal with `position: fixed` sidesteps that
 * entirely.
 *
 * Deliberately not a full floating-ui-style component: no continuous
 * repositioning while scrolled (it just closes on scroll instead), no
 * collision/flip logic beyond a simple viewport-edge clamp. That's
 * enough for a short, single-line-ish explanation string.
 */
function InfoTooltip({ label, content }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const computePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const TOOLTIP_WIDTH = 240;
    const margin = 8;
    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - margin));
    setCoords({ top: rect.bottom + 8, left, triggerCenter: rect.left + rect.width / 2 });
  };

  const show = () => {
    computePosition();
    setOpen(true);
  };
  const hide = () => setOpen(false);

  // Close on scroll (the row scrolling under it, or the page scrolling)
  // and on Escape, rather than continuously repositioning.
  useEffect(() => {
    if (!open) return undefined;

    function handleScroll() {
      hide();
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') hide();
    }
    function handlePointerDown(e) {
      if (triggerRef.current?.contains(e.target) || tooltipRef.current?.contains(e.target)) return;
      hide();
    }

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  if (!content) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          // Stop this from bubbling to an ancestor <Link> (movie cards
          // wrap this badge). Always show rather than toggling: on a
          // touch tap, `focus` (which already calls show()) and `click`
          // both fire for the same gesture, and reading `open` here
          // could race against that focus-triggered state update and
          // immediately re-close the tooltip it just opened. Closing is
          // handled separately via outside-tap/scroll/Escape.
          e.preventDefault();
          e.stopPropagation();
          show();
        }}
        aria-label={label}
        aria-expanded={open}
        title={label}
        className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-panel-raised text-[0.65rem] font-bold text-ink-muted transition-[color,background-color,transform] duration-150 hover:scale-110 hover:bg-brand hover:text-white focus-visible:scale-110 focus-visible:bg-brand focus-visible:text-white"
      >
        i
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={{ top: coords.top, left: coords.left, width: 240 }}
            className="fade-in fixed z-[200] rounded-lg bg-panel-raised p-3 text-xs leading-snug text-ink shadow-panel"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}

export default InfoTooltip;
