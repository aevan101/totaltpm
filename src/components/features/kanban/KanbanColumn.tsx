'use client';

import { useState, type DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { AddButton, Button, IconButton, Input } from '@/components/ui';
import { KanbanCard } from './KanbanCard';
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@/types';

interface TaskProgress {
  total: number;
  completed: number;
  percentage: number;
}

interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: KanbanCardType[];
  selectedCardId?: string | null;
  getCardProgress?: (cardId: string) => TaskProgress;
  onUpdateColumn: (id: string, title: string) => void;
  onDeleteColumn: (id: string) => void;
  onAddCard: (columnId: string, title: string) => void;
  onEditCard: (card: KanbanCardType) => void;
  onDeleteCard: (id: string) => void;
  onSelectCard?: (card: KanbanCardType) => void;
  onDragStart: (e: DragEvent, card: KanbanCardType) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent, columnId: string) => void;
}

export function KanbanColumn({
  column,
  cards,
  selectedCardId,
  getCardProgress,
  onUpdateColumn,
  onDeleteColumn,
  onAddCard,
  onEditCard,
  onDeleteCard,
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
        'flex flex-col shrink-0 bg-neutral-100 rounded-xl max-h-full',
        isDragOver && 'bg-neutral-200'
      )}
      style={{ padding: '15px', height: '100%', width: '290px', overflow: 'hidden' }}
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
        <div className="flex items-center gap-1">
          <AddButton label="Add card" onClick={() => setIsAddingCard(true)} />
          <IconButton
            variant="danger"
            size="sm"
            label="Delete column"
            onClick={() => {
              if (confirm('Delete this column and all its cards?')) {
                onDeleteColumn(column.id);
              }
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </IconButton>
        </div>
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
        <div className="flex flex-col items-center" style={{ paddingTop: '5px', gap: '6px' }}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id}
              taskProgress={getCardProgress?.(card.id)}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onSelect={onSelectCard}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
