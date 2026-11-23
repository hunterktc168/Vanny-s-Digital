'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const LOCAL_STORAGE_SYNC_EVENT = 'vanny-local-storage-sync';

function readStoredString(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (updater: T | ((prev: T) => T)) => void, () => void] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined') {
        return () => {};
      }

      const handleStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) {
          onStoreChange();
        }
      };

      const handleCustomSync = (event: Event) => {
        const customEvent = event as CustomEvent<{ key?: string }>;
        if (!customEvent.detail?.key || customEvent.detail.key === key) {
          onStoreChange();
        }
      };

      window.addEventListener('storage', handleStorage);
      window.addEventListener(LOCAL_STORAGE_SYNC_EVENT, handleCustomSync);

      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(LOCAL_STORAGE_SYNC_EVENT, handleCustomSync);
      };
    },
    [key]
  );

  const getSnapshot = useCallback(() => readStoredString(key), [key]);
  const getServerSnapshot = useCallback(() => null, []);

  const rawValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const value = useMemo<T>(() => {
    if (rawValue === null) return initialValue;
    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return initialValue;
    }
  }, [rawValue, initialValue]);

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const currentRaw = readStoredString(key);
      let currentValue = initialValue;
      if (currentRaw !== null) {
        try {
          currentValue = JSON.parse(currentRaw) as T;
        } catch {
          currentValue = initialValue;
        }
      }

      const nextValue =
        typeof updater === 'function'
          ? (updater as (prev: T) => T)(currentValue)
          : updater;

      try {
        if (nextValue === null || nextValue === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        }
      } catch {
        // Ignore storage quota or private-mode errors
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(LOCAL_STORAGE_SYNC_EVENT, { detail: { key } })
        );
      }
    },
    [key, initialValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_SYNC_EVENT, { detail: { key } })
      );
    }
  }, [key]);

  return [value, setValue, removeValue];
}
