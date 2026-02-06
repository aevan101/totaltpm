'use client';

import { useState, type DragEvent } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { KanbanColumn } from './KanbanColumn';
import { CardDetailModal } from './CardDetailModal';
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
    deleteColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
  } = useKanban();

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
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
        <div className="flex gap-6 h-full items-center" style={{ padding: '24px', paddingLeft: '50px' }}>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={getColumnCards(column.id)}
              projectTasks={projectTasks}
              selectedCardId={selectedCardId}
              getCardProgress={getCardProgress}
              onUpdateColumn={updateColumn}
              onDeleteColumn={deleteColumn}
              onAddCard={addCard}
              onEditCard={setEditingCard}
              onDeleteCard={deleteCard}
              onSelectCard={handleSelectCard}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}

          {/* Add Column */}
          <div className="w-72 shrink-0">
            {isAddingColumn ? (
              <div className="bg-neutral-100 rounded-md p-4 flex flex-col gap-3">
                <Input
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Column title"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn();
                    if (e.key === 'Escape') {
                      setNewColumnTitle('');
                      setIsAddingColumn(false);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddColumn} disabled={!newColumnTitle.trim()}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewColumnTitle('');
                      setIsAddingColumn(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-neutral-500 border border-dashed border-neutral-300 rounded-md h-12"
                onClick={() => setIsAddingColumn(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Column
              </Button>
            )}
          </div>
        </div>
      </div>

      <CardDetailModal
        card={editingCard}
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={handleSaveCard}
      />
    </div>
  );
}
