'use client';

import { useState, type DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { AddButton, Button, Input } from '@/components/ui';
import { KanbanCard } from './KanbanCard';
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType, Task } from '@/types';

interface TaskProgress {
  total: number;
  completed: number;
  percentage: number;
}

interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: KanbanCardType[];
  projectTasks?: Task[];
  selectedCardId?: string | null;
  getCardProgress?: (cardId: string) => TaskProgress;
  onUpdateColumn: (id: string, title: string) => void;
  onAddCard: (columnId: string, title: string) => void;
  onEditCard: (card: KanbanCardType) => void;
  onDeleteCard: (id: string) => void;
  onArchiveCard: (id: string) => void;
  onSelectCard?: (card: KanbanCardType) => void;
  onDragStart: (e: DragEvent, card: KanbanCardType) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent, columnId: string) => void;
}

export function KanbanColumn({
  column,
  cards,
  projectTasks,
  selectedCardId,
  getCardProgress,
  onUpdateColumn,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onArchiveCard,
  onSelectCard,
  onDragStart,
  onDragOver,
  onDrop,
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSaveTitle = () => {
    if (title.trim() && title !== column.title) {
      onUpdateColumn(column.id, title.trim());
    } else {
      setTitle(column.title);
    }
    setIsEditing(false);
  };

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, column.id);
  };

  return (
    <div
      className={cn(
        'flex flex-col flex-1 min-w-0 max-h-full border-r border-neutral-200 last:border-r-0',
        isDragOver && 'bg-neutral-50'
      )}
      style={{ padding: '8px 0', height: '100%', overflow: 'hidden' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') {
                setTitle(column.title);
                setIsEditing(false);
              }
            }}
            className="flex-1 px-2 py-1 text-sm font-semibold bg-white border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-500"
            autoFocus
          />
        ) : (
          <h3
            className="text-sm font-semibold text-neutral-700 cursor-pointer hover:text-neutral-900"
            onClick={() => setIsEditing(true)}
          >
            {column.title}
            <span className="text-neutral-400 font-normal" style={{ marginLeft: '8px' }}>({cards.length})</span>
          </h3>
        )}
        <AddButton label="Add card" onClick={() => setIsAddingCard(true)} />
      </div>

      {/* Add Card Form */}
      {isAddingCard && (
        <div className="px-5 pb-3">
          <div className="flex flex-col gap-2">
            <Input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Card title"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCard();
                if (e.key === 'Escape') {
                  setNewCardTitle('');
                  setIsAddingCard(false);
                }
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard} disabled={!newCardTitle.trim()}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNewCardTitle('');
                  setIsAddingCard(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 px-5 pb-5 min-h-[100px]" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
        <div className="flex flex-col" style={{ paddingTop: '5px', gap: '6px' }}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id}
              taskProgress={getCardProgress?.(card.id)}
              cardTasks={projectTasks?.filter((t) => t.cardId === card.id) ?? []}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onArchive={onArchiveCard}
              onSelect={onSelectCard}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
