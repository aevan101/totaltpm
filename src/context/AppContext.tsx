'use client';

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { useApiStorage } from '@/hooks/useApiStorage';
import { DEFAULT_COLUMNS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import type {
  Project,
  KanbanColumn,
  KanbanCard,
  Task,
  TaskPriority,
  Note,
  ViewType,
} from '@/types';

interface AppContextType {
  // State
  currentProjectId: string | null;
  currentView: ViewType;
  projects: Project[];
  columns: KanbanColumn[];
  cards: KanbanCard[];
  tasks: Task[];
  notes: Note[];
  isHydrated: boolean;
  selectedCardId: string | null;
  apiError: string | null;
  isSaving: boolean;

  // Project actions
  setCurrentProjectId: (id: string | null) => void;
  setCurrentView: (view: ViewType) => void;
  setSelectedCardId: (id: string | null) => void;
  createProject: (name: string, description?: string) => Project;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>) => void;
  deleteProject: (id: string) => void;

  // Kanban actions
  createColumn: (projectId: string, title: string) => KanbanColumn;
  updateColumn: (id: string, title: string) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (columns: KanbanColumn[]) => void;
  createCard: (columnId: string, title: string, description?: string, priority?: TaskPriority, dueDate?: number) => KanbanCard;
  updateCard: (id: string, updates: Partial<Pick<KanbanCard, 'title' | 'description' | 'priority' | 'dueDate' | 'columnId' | 'order'>>) => void;
  deleteCard: (id: string) => void;
  moveCard: (cardId: string, targetColumnId: string, newOrder: number) => void;

  // Task actions
  createTask: (projectId: string, title: string, data?: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;

  // Note actions
  createNote: (projectId: string, title: string, content?: string, cardId?: string | null) => Note;
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'cardId' | 'links'>>) => void;
  deleteNote: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data, isHydrated, error: apiError, isSaving, updateData } = useApiStorage();

  // Extract data from API storage
  const projects = data.projects;
  const columns = data.columns;
  const cards = data.cards;
  const tasks = data.tasks;
  const notes = data.notes;
  const currentProjectId = data.currentProjectId;

  // Setters that update API storage
  const setProjects = useCallback(
    (updater: Project[] | ((prev: Project[]) => Project[])) => {
      updateData('projects', updater);
    },
    [updateData]
  );

  const setColumns = useCallback(
    (updater: KanbanColumn[] | ((prev: KanbanColumn[]) => KanbanColumn[])) => {
      updateData('columns', updater);
    },
    [updateData]
  );

  const setCards = useCallback(
    (updater: KanbanCard[] | ((prev: KanbanCard[]) => KanbanCard[])) => {
      updateData('cards', updater);
    },
    [updateData]
  );

  const setTasks = useCallback(
    (updater: Task[] | ((prev: Task[]) => Task[])) => {
      updateData('tasks', updater);
    },
    [updateData]
  );

  const setNotes = useCallback(
    (updater: Note[] | ((prev: Note[]) => Note[])) => {
      updateData('notes', updater);
    },
    [updateData]
  );

  const setCurrentProjectId = useCallback(
    (id: string | null) => {
      updateData('currentProjectId', id);
    },
    [updateData]
  );

  // View state (not persisted - resets on refresh)
  const [currentView, setCurrentView] = useState<ViewType>('kanban');

  // Selection state (not persisted - resets on refresh)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Clear selection on project switch
  useEffect(() => {
    setSelectedCardId(null);
  }, [currentProjectId]);

  // Project actions
  const createProject = useCallback(
    (name: string, description?: string): Project => {
      const now = Date.now();
      const project: Project = {
        id: generateId(),
        name,
        description,
        createdAt: now,
        updatedAt: now,
      };

      setProjects((prev) => [...prev, project]);

      // Create default columns for the new project
      const newColumns = DEFAULT_COLUMNS.map((col, index) => ({
        id: generateId(),
        projectId: project.id,
        title: col.title,
        order: index,
        createdAt: now,
      }));
      setColumns((prev) => [...prev, ...newColumns]);

      setCurrentProjectId(project.id);
      return project;
    },
    [setProjects, setColumns, setCurrentProjectId]
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        )
      );
    },
    [setProjects]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setColumns((prev) => prev.filter((c) => c.projectId !== id));
      setCards((prev) => {
        const projectColumnIds = columns
          .filter((c) => c.projectId === id)
          .map((c) => c.id);
        return prev.filter((card) => !projectColumnIds.includes(card.columnId));
      });
      setTasks((prev) => prev.filter((t) => t.projectId !== id));
      setNotes((prev) => prev.filter((n) => n.projectId !== id));

      if (currentProjectId === id) {
        const remaining = projects.filter((p) => p.id !== id);
        setCurrentProjectId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [setProjects, setColumns, setCards, setTasks, setNotes, columns, projects, currentProjectId, setCurrentProjectId]
  );

  // Kanban actions
  const createColumn = useCallback(
    (projectId: string, title: string): KanbanColumn => {
      const projectColumns = columns.filter((c) => c.projectId === projectId);
      const maxOrder = projectColumns.length > 0
        ? Math.max(...projectColumns.map((c) => c.order))
        : -1;

      const column: KanbanColumn = {
        id: generateId(),
        projectId,
        title,
        order: maxOrder + 1,
        createdAt: Date.now(),
      };

      setColumns((prev) => [...prev, column]);
      return column;
    },
    [columns, setColumns]
  );

  const updateColumn = useCallback(
    (id: string, title: string) => {
      setColumns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    },
    [setColumns]
  );

  const deleteColumn = useCallback(
    (id: string) => {
      setColumns((prev) => prev.filter((c) => c.id !== id));
      setCards((prev) => prev.filter((card) => card.columnId !== id));
    },
    [setColumns, setCards]
  );

  const reorderColumns = useCallback(
    (reorderedColumns: KanbanColumn[]) => {
      setColumns((prev) => {
        const otherColumns = prev.filter(
          (c) => !reorderedColumns.find((rc) => rc.id === c.id)
        );
        return [...otherColumns, ...reorderedColumns];
      });
    },
    [setColumns]
  );

  const createCard = useCallback(
    (columnId: string, title: string, description?: string, priority?: TaskPriority, dueDate?: number): KanbanCard => {
      const columnCards = cards.filter((c) => c.columnId === columnId);
      const maxOrder = columnCards.length > 0
        ? Math.max(...columnCards.map((c) => c.order))
        : -1;

      const now = Date.now();
      const card: KanbanCard = {
        id: generateId(),
        title,
        description,
        priority: priority ?? 'p2',
        columnId,
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
        columnChangedAt: now,
        dueDate,
      };

      setCards((prev) => [...prev, card]);
      return card;
    },
    [cards, setCards]
  );

  const updateCard = useCallback(
    (id: string, updates: Partial<Pick<KanbanCard, 'title' | 'description' | 'priority' | 'dueDate' | 'columnId' | 'order'>>) => {
      setCards((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
        )
      );
    },
    [setCards]
  );

  const deleteCard = useCallback(
    (id: string) => {
      setCards((prev) => prev.filter((c) => c.id !== id));
      // Unlink tasks and notes (don't delete them)
      setTasks((prev) => prev.map((t) => t.cardId === id ? { ...t, cardId: null } : t));
      setNotes((prev) => prev.map((n) => n.cardId === id ? { ...n, cardId: null } : n));
      // Clear selection if deleted card was selected
      if (selectedCardId === id) setSelectedCardId(null);
    },
    [setCards, setTasks, setNotes, selectedCardId]
  );

  const moveCard = useCallback(
    (cardId: string, targetColumnId: string, newOrder: number) => {
      setCards((prev) => {
        const card = prev.find((c) => c.id === cardId);
        if (!card) return prev;

        const now = Date.now();
        const isColumnChange = card.columnId !== targetColumnId;

        // Update orders in target column
        const targetCards = prev
          .filter((c) => c.columnId === targetColumnId && c.id !== cardId)
          .sort((a, b) => a.order - b.order);

        // Insert at new position
        targetCards.splice(newOrder, 0, { ...card, columnId: targetColumnId });

        // Reassign orders
        const reorderedTargetCards = targetCards.map((c, index) => ({
          ...c,
          order: index,
          updatedAt: c.id === cardId ? now : c.updatedAt,
          // Update columnChangedAt only if moving to a different column
          columnChangedAt: c.id === cardId && isColumnChange ? now : c.columnChangedAt,
        }));

        // Get cards from other columns
        const otherCards = prev.filter(
          (c) => c.columnId !== targetColumnId && c.id !== cardId
        );

        return [...otherCards, ...reorderedTargetCards];
      });
    },
    [setCards]
  );

  // Task actions
  const createTask = useCallback(
    (projectId: string, title: string, data?: Partial<Task>): Task => {
      const now = Date.now();
      const task: Task = {
        id: generateId(),
        projectId,
        title,
        status: data?.status ?? 'todo',
        priority: data?.priority ?? 'p2',
        description: data?.description,
        dueDate: data?.dueDate,
        cardId: data?.cardId ?? null,
        createdAt: now,
        updatedAt: now,
      };

      setTasks((prev) => [...prev, task]);
      return task;
    },
    [setTasks]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
        )
      );
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [setTasks]
  );

  // Note actions
  const createNote = useCallback(
    (projectId: string, title: string, content?: string, cardId?: string | null): Note => {
      const now = Date.now();
      const note: Note = {
        id: generateId(),
        projectId,
        title,
        content: content ?? '',
        cardId: cardId ?? null,
        createdAt: now,
        updatedAt: now,
      };

      setNotes((prev) => [...prev, note]);
      return note;
    },
    [setNotes]
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'cardId' | 'links'>>) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        )
      );
    },
    [setNotes]
  );

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    [setNotes]
  );

  const value = useMemo(
    () => ({
      currentProjectId,
      currentView,
      projects,
      columns,
      cards,
      tasks,
      notes,
      isHydrated,
      selectedCardId,
      apiError,
      isSaving,
      setCurrentProjectId,
      setCurrentView,
      setSelectedCardId,
      createProject,
      updateProject,
      deleteProject,
      createColumn,
      updateColumn,
      deleteColumn,
      reorderColumns,
      createCard,
      updateCard,
      deleteCard,
      moveCard,
      createTask,
      updateTask,
      deleteTask,
      createNote,
      updateNote,
      deleteNote,
    }),
    [
      currentProjectId,
      currentView,
      projects,
      columns,
      cards,
      tasks,
      notes,
      isHydrated,
      selectedCardId,
      apiError,
      isSaving,
      setCurrentProjectId,
      createProject,
      updateProject,
      deleteProject,
      createColumn,
      updateColumn,
      deleteColumn,
      reorderColumns,
      createCard,
      updateCard,
      deleteCard,
      moveCard,
      createTask,
      updateTask,
      deleteTask,
      createNote,
      updateNote,
      deleteNote,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
