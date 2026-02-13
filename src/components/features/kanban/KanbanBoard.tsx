'use client';

import { useState, useRef, useCallback, useEffect, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useKanban } from '@/hooks/useKanban';
import { KanbanColumn } from './KanbanColumn';
import { CardDetailModal } from './CardDetailModal';
import { ArchiveModal } from './ArchiveModal';
import { Button, Input, EmptyState, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { TASK_PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import type { KanbanCard, Task, TaskPriority } from '@/types';

interface DragState {
  card: KanbanCard;
  offsetX: number;
  offsetY: number;
  cardWidth: number;
  x: number;
  y: number;
  targetColumnId: string | null;
}

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
    permanentDeleteCard,
    archiveCard,
    restoreCard,
    archivedCards,
    moveCard,
  } = useKanban();

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);

  // Refs for pointer event handling (avoid stale closures)
  const dragRef = useRef<DragState | null>(null);
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const didDragRef = useRef(false);

  // Get selected card for display
  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) : null;

  const handleSelectCard = (card: KanbanCard) => {
    // Only select if we didn't just drag
    if (!didDragRef.current) {
      setSelectedCardId(selectedCardId === card.id ? null : card.id);
    }
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

  // Column ref callback
  const setColumnRef = useCallback((columnId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      columnRefs.current.set(columnId, el);
    } else {
      columnRefs.current.delete(columnId);
    }
  }, []);

  // Hit-test which column the pointer is over
  const getTargetColumn = useCallback((clientX: number, clientY: number): string | null => {
    for (const [colId, el] of columnRefs.current) {
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return colId;
      }
    }
    return null;
  }, []);

  // Drag initiation
  const handleCardPointerDown = useCallback((e: PointerEvent, card: KanbanCard) => {
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    // Don't start drag from buttons or interactive elements
    if (target.closest('button') || target.closest('[role="button"]')) return;

    const cardEl = e.currentTarget as HTMLElement;
    const rect = cardEl.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const cardWidth = rect.width;
    const startX = e.clientX;
    const startY = e.clientY;

    didDragRef.current = false;
    let started = false;

    const handleMove = (moveE: globalThis.PointerEvent) => {
      if (!started) {
        const dx = moveE.clientX - startX;
        const dy = moveE.clientY - startY;
        if (Math.sqrt(dx * dx + dy * dy) < 5) return;
        started = true;
        didDragRef.current = true;
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        window.getSelection()?.removeAllRanges();
      }

      const targetColumnId = getTargetColumn(moveE.clientX, moveE.clientY);

      const state: DragState = {
        card,
        offsetX,
        offsetY,
        cardWidth,
        x: moveE.clientX,
        y: moveE.clientY,
        targetColumnId,
      };

      dragRef.current = state;
      setDragState(state);
    };

    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);

      const current = dragRef.current;
      if (started && current?.targetColumnId) {
        const targetCards = getColumnCards(current.targetColumnId);
        moveCard(current.card.id, current.targetColumnId, targetCards.length);
        setJustDroppedId(current.card.id);
        setTimeout(() => setJustDroppedId(null), 200);
      }

      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';

      dragRef.current = null;
      setDragState(null);

      // Prevent the click event from firing after drag
      if (started) {
        setTimeout(() => { didDragRef.current = false; }, 50);
      }
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  }, [getTargetColumn, getColumnCards, moveCard]);

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
      <div className="flex justify-end px-3 pt-2 pb-0.5">
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
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
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

      {/* Scrollable content area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full" style={{ padding: '0' }}>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              ref={setColumnRef(column.id)}
              column={column}
              cards={getColumnCards(column.id)}
              projectTasks={projectTasks}
              selectedCardId={selectedCardId}
              isDropTarget={dragState?.targetColumnId === column.id}
              draggedCardId={dragState?.card.id ?? null}
              getCardProgress={getCardProgress}
              onUpdateColumn={updateColumn}
              onAddCard={addCard}
              onEditCard={setEditingCard}
              onDeleteCard={deleteCard}
              onArchiveCard={archiveCard}
              onSelectCard={handleSelectCard}
              onCardDragStart={handleCardPointerDown}
            />
          ))}
        </div>
      </div>

      {/* Drag overlay */}
      {dragState && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            left: dragState.x - dragState.offsetX,
            top: dragState.y - dragState.offsetY,
            width: dragState.cardWidth,
            zIndex: 9999,
            pointerEvents: 'none',
            transform: 'rotate(2deg) scale(1.02)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.08)',
            borderRadius: '0.375rem',
            overflow: 'hidden',
            transition: 'transform 0.1s ease',
          }}
        >
          <div
            className="bg-white border-2 border-neutral-200 rounded-md"
            style={{ padding: '6px 10px' }}
          >
            <h4 className="text-sm font-medium text-neutral-900 leading-relaxed">{dragState.card.title}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge className={cn(PRIORITY_COLORS[dragState.card.priority ?? 'p2'], 'text-[10px] px-1.5 py-0')}>
                {TASK_PRIORITY_LABELS[dragState.card.priority ?? 'p2']}
              </Badge>
            </div>
          </div>
        </div>,
        document.body
      )}

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
        onDelete={permanentDeleteCard}
      />
    </div>
  );
}
