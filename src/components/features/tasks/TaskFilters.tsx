'use client';

import { Select, Input } from '@/components/ui';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/constants';
import type { TaskStatus, TaskPriority } from '@/types';

interface TaskFiltersProps {
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  search: string;
  onStatusChange: (status: TaskStatus | 'all') => void;
  onPriorityChange: (priority: TaskPriority | 'all') => void;
  onSearchChange: (search: string) => void;
}

export function TaskFilters({
  status,
  priority,
  search,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
}: TaskFiltersProps) {
  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const priorityOptions = [
    { value: 'all', label: 'All priorities' },
    ...Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="w-48">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
        />
      </div>
      <div className="w-40">
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus | 'all')}
          options={statusOptions}
        />
      </div>
      <div className="w-40">
        <Select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as TaskPriority | 'all')}
          options={priorityOptions}
        />
      </div>
    </div>
  );
}
