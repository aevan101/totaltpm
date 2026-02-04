'use client';

import { type ReactNode } from 'react';
import { ProjectSelector } from '@/components/features/project-selector/ProjectSelector';
import { useProjects } from '@/hooks/useProjects';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { currentProject } = useProjects();

  return (
    <div className="h-screen bg-neutral-100 overflow-hidden">
      {children}
    </div>
  );
}
