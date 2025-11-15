import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to callbacks
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+k': (e) => {
 *     e.preventDefault();
 *     // Open search
 *   },
 *   'ctrl+n': (e) => {
 *     e.preventDefault();
 *     navigate('/products/new');
 *   }
 * });
 */
export const useKeyboardShortcuts = (shortcuts = {}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey; // Support both Ctrl (Windows/Linux) and Cmd (Mac)
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Build key combination string
      let combination = '';
      if (ctrl) combination += 'ctrl+';
      if (shift) combination += 'shift+';
      if (alt) combination += 'alt+';
      combination += key;

      // Check if combination exists in shortcuts
      if (shortcuts[combination]) {
        event.preventDefault();
        shortcuts[combination](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

/**
 * Global keyboard shortcuts for the application
 */
export const useGlobalShortcuts = () => {
  const navigate = useNavigate();

  useKeyboardShortcuts({
    'ctrl+k': (e) => {
      e.preventDefault();
      // Focus on the first search input if available
      const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    'escape': (e) => {
      // Close modals if open
      const modals = document.querySelectorAll('.modal-overlay, [role="dialog"]');
      if (modals.length > 0) {
        const lastModal = modals[modals.length - 1];
        const closeButton = lastModal.querySelector('button[aria-label="Close"], .modal-close, button:contains("Close")');
        if (closeButton) {
          closeButton.click();
        }
      }
    }
  });
};

export default useKeyboardShortcuts;

