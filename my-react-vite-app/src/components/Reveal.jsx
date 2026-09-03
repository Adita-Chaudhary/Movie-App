import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

/**
 * Fades + slides a section in the first time it scrolls into view (see
 * requirement: scroll-reveal for below-the-fold sections like
 * "Recommended for You", "Cast", etc). Uses IntersectionObserver rather
 * than a scroll listener, and only ever animates once per element
 * (`triggerOnce`) - it never re-triggers when scrolling back up past it.
 *
 * Renders a plain wrapper element (default `div`) around its children -
 * the wrapped content keeps its own layout/margins untouched, this only
 * adds opacity/transform, so it can't cause a layout shift.
 */
function Reveal({ children, as: Tag = 'div', className = '' }) {
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px',
    triggerOnce: true,
  });

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
