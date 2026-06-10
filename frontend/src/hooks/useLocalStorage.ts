import { useCallback, useEffect, useState } from 'react';

/**
 * Persist a typed value to `localStorage` under `key`, restoring it on mount and
 * writing on change. SSR/test-safe: reads/writes are guarded so a missing
 * `window` (Node, jsdom without storage) falls back to the in-memory initial
 * value without throwing.
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] => {
  const read = (): T => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return initialValue;
    }
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialValue : (JSON.parse(raw) as T);
    } catch {
      return initialValue;
    }
  };

  const [value, setValue] = useState<T>(read);

  const setStored = useCallback(
    (next: T) => {
      setValue(next);
    },
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (private mode, quota) — keep the in-memory value.
    }
  }, [key, value]);

  return [value, setStored];
};
