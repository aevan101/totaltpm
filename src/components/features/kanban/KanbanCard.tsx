'use client';

import { useState, useMemo, type DragEvent, type MouseEvent } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { IconButton, Badge } from '@/components/ui';
import { TASK_PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import { DeliverableStatusModal } from './DeliverableStatusModal';
import type { KanbanCard as KanbanCardType, Task } from '@/types';

interface TaskProgress {
  total: number;
  completed: number;
  percentage: number;
}

interface KanbanCardProps {
  card: KanbanCardType;
  isSelected?: boolean;
  taskProgress?: TaskProgress;
  cardTasks?: Task[];
  onEdit: (card: KanbanCardType) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
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

export function KanbanCard({ card, isSelected, taskProgress, cardTasks = [], onEdit, onDelete, onArchive, onSelect, onDragStart }: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const daysInfo = useMemo(() => getDaysInColumn(card.columnChangedAt), [card.columnChangedAt]);
  const isOverdue = card.dueDate && card.dueDate < Date.now();

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

  const handleStatusClick = (e: MouseEvent) => {
    e.stopPropagation();
    setShowStatus(true);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={cn(
        'bg-white border-2 rounded-md cursor-pointer w-full',
        'hover:border-neutral-200 transition-all group',
        'shadow-sm hover:shadow',
        isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-white',
        isDragging && 'opacity-50 cursor-grabbing'
      )}
      style={{ padding: '6px 10px', overflow: 'hidden' }}
    >
      <div className="relative">
        <div>
          <h4 className="text-sm font-medium text-neutral-900 leading-relaxed pr-2">{card.title}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge className={cn(PRIORITY_COLORS[card.priority ?? 'p2'], 'text-[10px] px-1.5 py-0')}>
              {TASK_PRIORITY_LABELS[card.priority ?? 'p2']}
            </Badge>
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
          {card.dueDate && (
            <div className="flex items-center gap-1 mt-1 whitespace-nowrap overflow-hidden">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke={isOverdue ? '#dc2626' : '#6b7280'} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span className={cn(
                'text-xs truncate',
                isOverdue ? 'text-red-600 font-medium' : 'text-neutral-500'
              )}>
                {isOverdue ? 'Overdue: ' : 'Due: '}{new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
              </span>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-md">
          <IconButton
            variant="ghost"
            size="sm"
            label="Status summary"
            onClick={handleStatusClick}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </IconButton>
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
            variant="ghost"
            size="sm"
            label="Archive card"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(card.id);
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
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

      <DeliverableStatusModal
        card={card}
        tasks={cardTasks}
        isOpen={showStatus}
        onClose={() => setShowStatus(false)}
      />
    </div>
  );
}
