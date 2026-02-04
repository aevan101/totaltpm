'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';

export function useProjects() {
  const {
    projects,
    currentProjectId,
    setCurrentProjectId,
    createProject,
    updateProject,
    deleteProject,
  } = useApp();

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  );

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt - a.updatedAt),
    [projects]
  );

  return {
    projects: sortedProjects,
    currentProject,
    currentProjectId,
    setCurrentProjectId,
    createProject,
    updateProject,
    deleteProject,
  };
}
