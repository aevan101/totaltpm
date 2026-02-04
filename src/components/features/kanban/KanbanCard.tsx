'use client';

import { useState, useMemo, type DragEvent, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui';
import type { KanbanCard as KanbanCardType } from '@/types';

interface TaskProgress {
  total: number;
  completed: number;
  percentage: number;
}

interface KanbanCardProps {
  card: KanbanCardType;
  isSelected?: boolean;
  taskProgress?: TaskProgress;
  onEdit: (card: KanbanCardType) => void;
  onDelete: (id: string) => void;
  onSelect?: (card: KanbanCardType) => void;
  onDragStart: (e: DragEvent, card: KanbanCardType) => void;
}

function getDaysInColumn(columnChangedAt: number | undefined): { days: number; label: string } {
  if (!columnChangedAt) return { days: 0, label: 'today' };

  const now = Date.now();
  const diffMs = now - columnChangedAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { days: 0, label: 'today' };
  if (diffDays === 1) return { days: 1, label: '1 day' };
  return { days: diffDays, label: `${diffDays} days` };
}

export function KanbanCard({ card, isSelected, taskProgress, onEdit, onDelete, onSelect, onDragStart }: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const daysInfo = useMemo(() => getDaysInColumn(card.columnChangedAt), [card.columnChangedAt]);

  const handleDragStart = (e: DragEvent) => {
    setIsDragging(true);
    onDragStart(e, card);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: MouseEvent) => {
    // If clicking the select area or the card itself (not buttons)
    if (onSelect) {
      onSelect(card);
    }
  };

  const handleEditClick = (e: MouseEvent) => {
    e.stopPropagation();
    onEdit(card);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={cn(
        'bg-white border-2 rounded-lg cursor-pointer w-60 mx-auto',
        'hover:border-neutral-200 transition-all group',
        'shadow-sm hover:shadow',
        isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-white',
        isDragging && 'opacity-50 cursor-grabbing'
      )}
      style={{ padding: '6px 10px', overflow: 'hidden' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-neutral-900 leading-relaxed truncate">{card.title}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={cn(
              'text-xs',
              daysInfo.days >= 7 ? 'text-amber-600 font-medium' :
              daysInfo.days >= 3 ? 'text-neutral-500' :
              'text-neutral-400'
            )}>
              {daysInfo.label}
            </span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <IconButton
            variant="ghost"
            size="sm"
            label="Edit card"
            onClick={handleEditClick}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </IconButton>
          <IconButton
            variant="danger"
            size="sm"
            label="Delete card"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Task Progress */}
      {taskProgress && taskProgress.total > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>{taskProgress.completed}/{taskProgress.total} tasks</span>
            <span>{taskProgress.percentage}%</span>
          </div>
          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                taskProgress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${taskProgress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
