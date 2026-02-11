'use client';

import { useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import type { TaskStatus, TaskPriority, LinkAttachment } from '@/types';

interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  search?: string;
  cardId?: string | null;  // undefined = all, null = unlinked only, string = specific card
}

export function useTasks(filters?: TaskFilters) {
  const {
    currentProjectId,
    tasks,
    createTask,
    updateTask,
    deleteTask,
  } = useApp();

  const projectTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.projectId === currentProjectId);

    // Filter by cardId
    if (filters?.cardId !== undefined) {
      if (filters.cardId === null) {
        // Show only unlinked tasks
        filtered = filtered.filter((t) => !t.cardId);
      } else {
        // Show only tasks linked to specific card
        filtered = filtered.filter((t) => t.cardId === filters.cardId);
      }
    }

    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    if (filters?.priority && filters.priority !== 'all') {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search)
      );
    }

    // Sort by priority (P0 first) when filtering by a deliverable, otherwise by newest first
    if (filters?.cardId) {
      const priorityOrder: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3, p4: 4 };
      return filtered.sort((a, b) => (priorityOrder[a.priority] ?? 5) - (priorityOrder[b.priority] ?? 5) || b.createdAt - a.createdAt);
    }
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, currentProjectId, filters?.status, filters?.priority, filters?.search, filters?.cardId]);

  const taskCounts = useMemo(() => {
    const projectTasks = tasks.filter((t) => t.projectId === currentProjectId);
    return {
      total: projectTasks.length,
      todo: projectTasks.filter((t) => t.status === 'todo').length,
      inProgress: projectTasks.filter((t) => t.status === 'in-progress').length,
      done: projectTasks.filter((t) => t.status === 'done').length,
    };
  }, [tasks, currentProjectId]);

  // Helper to get task progress for a specific card
  const getCardTaskProgress = useCallback((cardId: string) => {
    const cardTasks = tasks.filter((t) => t.projectId === currentProjectId && t.cardId === cardId);
    const completed = cardTasks.filter((t) => t.status === 'done').length;
    const total = cardTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [tasks, currentProjectId]);

  const addTask = (title: string, data?: { description?: string; priority?: TaskPriority; dueDate?: number; cardId?: string | null; links?: LinkAttachment[] }) => {
    if (currentProjectId) {
      return createTask(currentProjectId, title, data);
    }
  };

  return {
    tasks: projectTasks,
    taskCounts,
    addTask,
    updateTask,
    deleteTask,
    getCardTaskProgress,
  };
}
