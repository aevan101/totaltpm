'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFromStorage, setToStorage } from '@/lib/storage';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue);
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const value = getFromStorage(key, initialValueRef.current);
    setStoredValue(value);
    setIsHydrated(true);
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        setToStorage(key, valueToStore);
        return valueToStore;
      });
    },
    [key]
  );

  return [storedValue, setValue, isHydrated] as const;
}
