import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value`. Used to throttle search input so the
 * server query fires after the user pauses typing, not on every keystroke.
 */
export const useDebouncedValue = <T>(value: T, delayMs = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
};
