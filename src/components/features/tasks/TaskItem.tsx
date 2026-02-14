'use client';

import { cn } from '@/lib/utils';
import { Badge, IconButton } from '@/components/ui';
import { PRIORITY_COLORS, STATUS_COLORS, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskItemProps {
  task: Task;
  cardTitle?: string;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export function TaskItem({ task, cardTitle, onEdit, onDelete, onToggleStatus }: TaskItemProps) {
  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== 'done';

  return (
    <div
      className={cn(
        'bg-white border border-neutral-200 rounded-md transition-all hover:border-neutral-300 group overflow-hidden cursor-pointer',
        task.status === 'done' && 'opacity-60'
      )}
      style={{ padding: '10px 14px' }}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id); }}
          className={cn(
            'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
            task.status === 'done'
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-neutral-300 hover:border-neutral-400'
          )}
        >
          {task.status === 'done' && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                'text-sm font-medium text-neutral-900',
                task.status === 'done' && 'line-through'
              )}
            >
              {task.title}
            </h4>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <IconButton
                variant="ghost"
                size="sm"
                label="Edit task"
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </IconButton>
              <IconButton
                variant="danger"
                size="sm"
                label="Delete task"
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </IconButton>
            </div>
          </div>

          {task.description && (
            <p className="mt-1 text-sm text-neutral-500 line-clamp-2 leading-snug">{task.description}</p>
          )}

          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <Badge className={STATUS_COLORS[task.status]}>
              {TASK_STATUS_LABELS[task.status]}
            </Badge>
            <Badge className={PRIORITY_COLORS[task.priority]}>
              {TASK_PRIORITY_LABELS[task.priority]}
            </Badge>
            {cardTitle && (
              <Badge className="bg-purple-100 text-purple-700">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                {cardTitle}
              </Badge>
            )}
            {task.links && task.links.length > 0 && (
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  'text-xs',
                  isOverdue ? 'text-red-600' : 'text-neutral-500'
                )}
              >
                Due: {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
