'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Button, Input, Modal, IconButton } from '@/components/ui';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { cn } from '@/lib/utils';

export function ProjectSelector() {
  const {
    projects,
    currentProject,
    setCurrentProjectId,
    createProject,
    deleteProject,
  } = useProjects();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
      setNewProjectName('');
      setNewProjectDescription('');
      setIsCreateModalOpen(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project? All data will be lost.')) {
      deleteProject(id);
    }
  };

  return (
    <div>
      <Dropdown
        align="left"
        trigger={
          <button
            className={cn(
              'w-full flex items-center justify-between pl-5 pr-3 py-2.5 h-[37px] rounded-md',
              'border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors',
              'text-sm'
            )}
          >
            <span
              style={{ marginLeft: '3px' }}
              className={cn(
                'truncate',
                currentProject ? 'text-neutral-900' : 'text-neutral-500'
              )}
            >
              {currentProject?.name ?? 'Select project'}
            </span>
            <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        }
      >
        <div className="max-h-64 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-500">
              No projects yet
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  'flex items-center justify-between px-3 py-2 hover:bg-neutral-100 cursor-pointer group',
                  currentProject?.id === project.id && 'bg-neutral-50'
                )}
              >
                <button
                  onClick={() => setCurrentProjectId(project.id)}
                  className="flex-1 text-left text-sm text-neutral-700 truncate"
                >
                  {project.name}
                </button>
                <IconButton
                  variant="danger"
                  size="sm"
                  label="Delete project"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </IconButton>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-neutral-200 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full justify-start"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Project
          </Button>
        </div>
      </Dropdown>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewProjectName('');
          setNewProjectDescription('');
        }}
        title="Create New Project"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateProject();
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="My Project"
            autoFocus
          />
          <Input
            label="Description (optional)"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            placeholder="A brief description"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewProjectName('');
                setNewProjectDescription('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!newProjectName.trim()}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
