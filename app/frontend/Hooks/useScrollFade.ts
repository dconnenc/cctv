import { useEffect } from 'react';

/**
 * Hook to manage scroll fade indicators on scrollable elements.
 * Sets data attributes on the element to indicate scroll position:
 * - data-at-top: Set when scrolled to the top
 * - data-at-bottom: Set when scrolled to the bottom
 *
 * These attributes can be used with CSS to show/hide fade indicators.
 *
 * @example
 * ```tsx
 * const scrollRef = useRef<HTMLDivElement>(null);
 * useScrollFade(scrollRef);
 *
 * return <div ref={scrollRef} className="scrollable">...</div>;
 * ```
 */
export function useScrollFade(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateScrollIndicators = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isAtTop = scrollTop === 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if (isAtTop) {
        element.setAttribute('data-at-top', 'true');
      } else {
        element.removeAttribute('data-at-top');
      }

      if (isAtBottom) {
        element.setAttribute('data-at-bottom', 'true');
      } else {
        element.removeAttribute('data-at-bottom');
      }
    };

    updateScrollIndicators();
    element.addEventListener('scroll', updateScrollIndicators);

    // Update on content changes
    const observer = new MutationObserver(updateScrollIndicators);
    observer.observe(element, { childList: true, subtree: true });

    return () => {
      element.removeEventListener('scroll', updateScrollIndicators);
      observer.disconnect();
    };
  }, [ref]);
}
