'use client';

import { useProjects } from '@/hooks/useProjects';
import { useApp } from '@/context/AppContext';

export function Header() {
  const { currentProject } = useProjects();
  const { currentView } = useApp();

  const viewTitles = {
    kanban: 'Kanban Board',
    tasks: 'Tasks',
    notes: 'Notes',
  };

  return (
    <header className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-neutral-900">
          {currentProject ? viewTitles[currentView] : 'Project Management'}
        </h1>
        {currentProject && (
          <span className="text-sm text-neutral-500">
            {currentProject.name}
          </span>
        )}
      </div>
    </header>
  );
}
