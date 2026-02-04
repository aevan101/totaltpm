'use client';

import { useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { sortByOrder } from '@/lib/utils';

export function useKanban() {
  const {
    currentProjectId,
    columns,
    cards,
    tasks,
    selectedCardId,
    setSelectedCardId,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
  } = useApp();

  const projectColumns = useMemo(
    () =>
      sortByOrder(
        columns.filter((c) => c.projectId === currentProjectId)
      ),
    [columns, currentProjectId]
  );

  const getColumnCards = useMemo(
    () => (columnId: string) =>
      sortByOrder(cards.filter((c) => c.columnId === columnId)),
    [cards]
  );

  // Get progress for a specific card
  const getCardProgress = useCallback((cardId: string) => {
    const cardTasks = tasks.filter((t) => t.projectId === currentProjectId && t.cardId === cardId);
    const completed = cardTasks.filter((t) => t.status === 'done').length;
    const total = cardTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [tasks, currentProjectId]);

  const addColumn = (title: string) => {
    if (currentProjectId) {
      createColumn(currentProjectId, title);
    }
  };

  const addCard = (columnId: string, title: string, description?: string) => {
    createCard(columnId, title, description);
  };

  return {
    columns: projectColumns,
    cards,
    getColumnCards,
    selectedCardId,
    setSelectedCardId,
    getCardProgress,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
  };
}
