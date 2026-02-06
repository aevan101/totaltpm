'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { loadData, saveData, type AppData } from '@/lib/api';

const DEFAULT_DATA: AppData = {
  projects: [],
  columns: [],
  cards: [],
  tasks: [],
  notes: [],
  currentProjectId: null,
};

export function useApiStorage() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Track pending saves for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<AppData | null>(null);

  // Load data on mount
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const loadedData = await loadData();
        if (mounted) {
          setData(loadedData);
          setIsHydrated(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load data');
          setIsHydrated(true);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(async (newData: AppData) => {
    // Store the latest data to save
    pendingDataRef.current = newData;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      if (pendingDataRef.current) {
        setIsSaving(true);
        const success = await saveData(pendingDataRef.current);
        setIsSaving(false);
        if (!success) {
          setError('Failed to save data');
        } else {
          setError(null);
        }
        pendingDataRef.current = null;
      }
    }, 300);
  }, []);

  // Update a specific field with automatic save
  const updateData = useCallback(
    <K extends keyof AppData>(key: K, updater: AppData[K] | ((prev: AppData[K]) => AppData[K])) => {
      setData((prev) => {
        const newValue = typeof updater === 'function'
          ? (updater as (prev: AppData[K]) => AppData[K])(prev[key])
          : updater;
        const newData = { ...prev, [key]: newValue };
        debouncedSave(newData);
        return newData;
      });
    },
    [debouncedSave]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Force save any pending data on unmount
      if (pendingDataRef.current) {
        saveData(pendingDataRef.current);
      }
    };
  }, []);

  return {
    data,
    isHydrated,
    error,
    isSaving,
    updateData,
  };
}
