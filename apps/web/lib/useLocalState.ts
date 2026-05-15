"use client";
import * as React from "react";

const PREFIX = "revagent:";

export function useLocalState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const storageKey = PREFIX + key;
  const [value, setValue] = React.useState<T>(initial);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [storageKey]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* ignore quota / private mode */
    }
  }, [storageKey, value, hydrated]);

  const clear = React.useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setValue(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  return [value, setValue, clear];
}
