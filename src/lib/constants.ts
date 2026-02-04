export const STORAGE_KEYS = {
  PROJECTS: 'pm_projects',
  COLUMNS: 'pm_columns',
  CARDS: 'pm_cards',
  TASKS: 'pm_tasks',
  NOTES: 'pm_notes',
  CURRENT_PROJECT: 'pm_current_project',
} as const;

export const DEFAULT_COLUMNS = [
  { title: 'To Do', order: 0 },
  { title: 'In Progress', order: 1 },
  { title: 'Done', order: 2 },
] as const;

export const TASK_STATUS_LABELS: Record<string, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  'p0': 'P0',
  'p1': 'P1',
  'p2': 'P2',
  'p3': 'P3',
  'p4': 'P4',
};

export const PRIORITY_COLORS: Record<string, string> = {
  'p0': 'bg-red-100 text-red-700',
  'p1': 'bg-orange-100 text-orange-700',
  'p2': 'bg-amber-100 text-amber-700',
  'p3': 'bg-blue-100 text-blue-700',
  'p4': 'bg-gray-100 text-gray-700',
};

export const STATUS_COLORS: Record<string, string> = {
  'todo': 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'done': 'bg-green-100 text-green-700',
};
