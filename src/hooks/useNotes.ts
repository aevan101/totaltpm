'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';

export function useNotes(searchQuery?: string, cardId?: string | null) {
  const {
    currentProjectId,
    notes,
    createNote,
    updateNote,
    deleteNote,
  } = useApp();

  const projectNotes = useMemo(() => {
    let filtered = notes.filter((n) => n.projectId === currentProjectId);

    // Filter by cardId
    if (cardId !== undefined) {
      if (cardId === null) {
        // Show only unlinked notes
        filtered = filtered.filter((n) => !n.cardId);
      } else {
        // Show only notes linked to specific card
        filtered = filtered.filter((n) => n.cardId === cardId);
      }
    }

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.content.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, currentProjectId, searchQuery, cardId]);

  const addNote = (title: string, content?: string, linkedCardId?: string | null) => {
    if (currentProjectId) {
      return createNote(currentProjectId, title, content, linkedCardId);
    }
  };

  return {
    notes: projectNotes,
    addNote,
    updateNote,
    deleteNote,
  };
}
