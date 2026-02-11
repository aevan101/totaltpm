'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTasks } from '@/hooks/useTasks';
import { TaskItem } from './TaskItem';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { AddButton, Input, Select, Modal, Button } from '@/components/ui';
import { TASK_PRIORITY_LABELS } from '@/lib/constants';
import type { Task, TaskStatus, TaskPriority } from '@/types';

export function TasksPanel() {
  const { selectedCardId, cards, columns, currentProjectId } = useApp();

  // Filter cards to current project only
  const projectColumnIds = columns.filter((c) => c.projectId === currentProjectId).map((c) => c.id);
  const projectCards = cards.filter((c) => projectColumnIds.includes(c.columnId) && !c.archived);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Get selected card for display
  const selectedCard = selectedCardId ? projectCards.find((c) => c.id === selectedCardId) : null;

  const { tasks, addTask, updateTask, deleteTask } = useTasks({
    status: statusFilter,
    search: searchFilter,
    cardId: selectedCardId ?? undefined,  // Filter by selected card
  });

  const handleToggleStatus = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
      updateTask(id, { status: newStatus });
    }
  };

  const handleDeleteTask = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      deleteTask(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const handleCreateTask = (data: { title: string; description?: string; priority: TaskPriority; dueDate?: number; cardId?: string; links?: import('@/types').LinkAttachment[] }) => {
    addTask(data.title, {
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      cardId: data.cardId,
      links: data.links,
    });
  };

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-neutral-900">Tasks</h2>
          {selectedCard && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
              {selectedCard.title}
            </span>
          )}
        </div>
        <AddButton label="Add task" onClick={() => setIsCreateModalOpen(true)} />
      </div>

      {/* Filters */}
      <div className="px-4 py-2 flex flex-col gap-2">
        <Input
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search..."
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
          options={statusOptions}
        />
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tasks.length === 0 ? (
          <div className="text-center text-sm text-neutral-400 py-12">
            {searchFilter || statusFilter !== 'all'
              ? 'No tasks match filters'
              : selectedCard
                ? `No tasks linked to "${selectedCard.title}"`
                : 'No tasks yet'}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                cardTitle={task.cardId ? projectCards.find((c) => c.id === task.cardId)?.title : undefined}
                onEdit={setEditingTask}
                onDelete={handleDeleteTask}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskDetailModal
        task={editingTask}
        cards={projectCards}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={updateTask}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        cards={projectCards}
        selectedCardId={selectedCardId ?? undefined}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateTask}
      />

      <Modal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Delete Task" size="sm">
        <p className="text-sm text-neutral-600 mb-4">Are you sure you want to delete this task? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button size="sm" variant="danger" onClick={handleConfirmDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
