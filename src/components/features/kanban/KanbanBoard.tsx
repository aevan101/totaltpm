'use client';

import { useState, type DragEvent } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { KanbanColumn } from './KanbanColumn';
import { CardDetailModal } from './CardDetailModal';
import { ArchiveModal } from './ArchiveModal';
import { Button, Input, EmptyState } from '@/components/ui';
import type { KanbanCard, Task, TaskPriority } from '@/types';

export function KanbanBoard() {
  const {
    columns,
    cards,
    projectTasks,
    getColumnCards,
    selectedCardId,
    setSelectedCardId,
    getCardProgress,
    addColumn,
    updateColumn,
    addCard,
    updateCard,
    deleteCard,
    archiveCard,
    restoreCard,
    archivedCards,
    moveCard,
  } = useKanban();

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);

  // Get selected card for display
  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) : null;

  const handleSelectCard = (card: KanbanCard) => {
    // Toggle selection
    setSelectedCardId(selectedCardId === card.id ? null : card.id);
  };

  const handleClearSelection = () => {
    setSelectedCardId(null);
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle.trim());
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const handleDragStart = (e: DragEvent, card: KanbanCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedCard) {
      const targetCards = getColumnCards(columnId);
      moveCard(draggedCard.id, columnId, targetCards.length);
      setDraggedCard(null);
    }
  };

  const handleSaveCard = (id: string, updates: { title: string; description?: string; priority?: TaskPriority; dueDate?: number }) => {
    updateCard(id, updates);
  };

  if (columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
          title="No columns yet"
          description="Add your first column to start organizing your tasks on the kanban board."
          action={
            <Button onClick={() => setIsAddingColumn(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Column
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Archive button */}
      <div className="flex justify-end px-4 pt-3 pb-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsArchiveOpen(true)}
          className="text-neutral-500 hover:text-neutral-700"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          Archive{archivedCards.length > 0 && ` (${archivedCards.length})`}
        </Button>
      </div>

      {/* Clear filter banner when card is selected */}
      {selectedCard && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">
              Filtering by: <span className="font-medium">{selectedCard.title}</span>
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearSelection}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filter
          </Button>
        </div>
      )}

      {/* Scrollable content area - scrollbar at bottom */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full" style={{ padding: '0' }}>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={getColumnCards(column.id)}
              projectTasks={projectTasks}
              selectedCardId={selectedCardId}
              getCardProgress={getCardProgress}
              onUpdateColumn={updateColumn}
              onAddCard={addCard}
              onEditCard={setEditingCard}
              onDeleteCard={deleteCard}
              onArchiveCard={archiveCard}
              onSelectCard={handleSelectCard}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}

        </div>
      </div>

      <CardDetailModal
        card={editingCard}
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={handleSaveCard}
      />

      <ArchiveModal
        isOpen={isArchiveOpen}
        archivedCards={archivedCards}
        onClose={() => setIsArchiveOpen(false)}
        onRestore={restoreCard}
        onDelete={deleteCard}
      />
    </div>
  );
}
