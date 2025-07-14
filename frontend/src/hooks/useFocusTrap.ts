import { useEffect, RefObject } from 'react';

/**
 * Hook to trap focus within a container element
 * Ensures keyboard navigation stays within modal/dialog components
 * @param containerRef - Reference to the container element
 * @param isActive - Whether the focus trap is active
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean
): void {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    
    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];
      
      const elements = container.querySelectorAll<HTMLElement>(
        focusableSelectors.join(',')
      );
      
      return Array.from(elements).filter(
        el => !el.hasAttribute('aria-hidden') && 
              el.offsetParent !== null // Element is visible
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Shift + Tab (backwards)
      if (event.shiftKey) {
        if (activeElement === firstElement || !container.contains(activeElement as Node)) {
          event.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab (forwards)
      else {
        if (activeElement === lastElement || !container.contains(activeElement as Node)) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element on mount ONLY if nothing is currently focused
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0 && !container.contains(document.activeElement)) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        // Double-check that nothing is focused (user might have clicked an input)
        if (!container.contains(document.activeElement)) {
          const firstElement = getFocusableElements()[0];
          if (firstElement) {
            firstElement.focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
}