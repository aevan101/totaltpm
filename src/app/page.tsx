'use client';

import { AppShell } from '@/components/layout';
import { useApp } from '@/context/AppContext';
import { KanbanBoard } from '@/components/features/kanban/KanbanBoard';
import { TasksPanel } from '@/components/features/tasks/TasksPanel';
import { NotesPanel } from '@/components/features/notes/NotesPanel';
import { ProjectSelector } from '@/components/features/project-selector/ProjectSelector';
import { EmptyState, Button } from '@/components/ui';
import { useState, useEffect, useCallback } from 'react';
import { Modal, Input } from '@/components/ui';

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}

function WelcomeScreen() {
  const { createProject } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleCreate = () => {
    if (projectName.trim()) {
      createProject(projectName.trim(), projectDescription.trim() || undefined);
      setProjectName('');
      setProjectDescription('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <EmptyState
        icon={
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        }
        title="Welcome to ProjectHub"
        description="Create your first project to get started with kanban boards, tasks, and notes."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Project
          </Button>
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProjectName('');
          setProjectDescription('');
        }}
        title="Create New Project"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My Project"
            autoFocus
          />
          <Input
            label="Description (optional)"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="A brief description"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setProjectName('');
                setProjectDescription('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!projectName.trim()}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Dashboard() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <div className="relative flex h-full p-6 gap-4 bg-neutral-100 border-[20px] border-transparent">
      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 p-2 rounded-md bg-white/80 hover:bg-white text-neutral-500 hover:text-neutral-700 transition-colors shadow-sm"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        )}
      </button>

      {/* Left Column - Project Selector + Tasks */}
      <div className="w-[30%] shrink-0 flex flex-col gap-2">
        {/* Project Selector */}
        <div style={{ marginTop: '1px' }}>
          <ProjectSelector />
        </div>
        {/* Tasks Panel */}
        <div className="flex-1 bg-white rounded-md overflow-hidden shadow-sm border-2 border-white">
          <TasksPanel />
        </div>
      </div>

      {/* Right Column - Kanban + Notes stacked */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Kanban Board - aligned with project selector */}
        <div className="h-[45%] bg-white rounded-md overflow-hidden shadow-sm border-2 border-white">
          <KanbanBoard />
        </div>

        {/* Notes */}
        <div className="flex-1 bg-white rounded-md overflow-hidden shadow-sm border-2 border-white">
          <NotesPanel />
        </div>
      </div>
    </div>
  );
}

function MainContent() {
  const { currentProjectId, isHydrated } = useApp();

  if (!isHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!currentProjectId) {
    return <WelcomeScreen />;
  }

  return <Dashboard />;
}

export default function Home() {
  return (
    <AppShell>
      <MainContent />
    </AppShell>
  );
}
