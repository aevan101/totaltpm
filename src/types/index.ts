// Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

// Kanban
export interface KanbanColumn {
  id: string;
  projectId: string;
  title: string;
  order: number;
  createdAt: number;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  columnId: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  columnChangedAt: number;  // When card entered current column
  dueDate?: number;
  archived?: boolean;
  archivedAt?: number;
  archiveReason?: 'archived' | 'deleted';
  linkedTaskIds?: string[];
  linkedNoteIds?: string[];
}

// Link attachment
export interface LinkAttachment {
  url: string;
  title?: string;
}

// Task
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'p0' | 'p1' | 'p2' | 'p3' | 'p4';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: number;
  cardId?: string | null;  // Optional link to KanbanCard
  links?: LinkAttachment[];  // Attached links
  comments?: string;  // Free-form notes/comments
  createdAt: number;
  updatedAt: number;
}

// Note
export interface Note {
  id: string;
  projectId: string;
  title: string;
  content: string;
  cardId?: string | null;  // Optional link to KanbanCard
  links?: LinkAttachment[];  // Attached links
  createdAt: number;
  updatedAt: number;
}

// View
export type ViewType = 'kanban' | 'tasks' | 'notes';

// App State
export interface AppState {
  currentProjectId: string | null;
  currentView: ViewType;
  projects: Project[];
  columns: KanbanColumn[];
  cards: KanbanCard[];
  tasks: Task[];
  notes: Note[];
}
