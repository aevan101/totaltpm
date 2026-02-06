'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTasks } from '@/hooks/useTasks';
import { TaskItem } from './TaskItem';
import { TaskFilters } from './TaskFilters';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { Button, EmptyState } from '@/components/ui';
import type { Task, TaskStatus, TaskPriority } from '@/types';

export function TaskList() {
  const { cards, selectedCardId } = useApp();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get selected card for display
  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) : null;

  const { tasks, taskCounts, addTask, updateTask, deleteTask } = useTasks({
    status: statusFilter,
    priority: priorityFilter,
    search: searchFilter,
    cardId: selectedCardId ?? undefined,
  });

  const handleToggleStatus = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
      updateTask(id, { status: newStatus });
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
    }
  };

  const handleCreateTask = (data: { title: string; description?: string; priority: TaskPriority; dueDate?: number }) => {
    addTask(data.title, {
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      cardId: selectedCardId,
    });
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <TaskFilters
            status={statusFilter}
            priority={priorityFilter}
            search={searchFilter}
            onStatusChange={setStatusFilter}
            onPriorityChange={setPriorityFilter}
            onSearchChange={setSearchFilter}
          />
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Task
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white border border-neutral-200 rounded-md px-4 py-3">
          <div className="text-2xl font-semibold text-neutral-900">{taskCounts.total}</div>
          <div className="text-xs text-neutral-500">Total</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-md px-4 py-3">
          <div className="text-2xl font-semibold text-neutral-900">{taskCounts.todo}</div>
          <div className="text-xs text-neutral-500">To Do</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-md px-4 py-3">
          <div className="text-2xl font-semibold text-neutral-900">{taskCounts.inProgress}</div>
          <div className="text-xs text-neutral-500">In Progress</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-md px-4 py-3">
          <div className="text-2xl font-semibold text-green-600">{taskCounts.done}</div>
          <div className="text-xs text-neutral-500">Done</div>
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title={searchFilter || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No tasks match your filters' : 'No tasks yet'}
          description={
            searchFilter || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters to see more tasks.'
              : 'Create your first task to start tracking your work.'
          }
          action={
            !searchFilter && statusFilter === 'all' && priorityFilter === 'all' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Task
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              cardTitle={task.cardId ? cards.find((c) => c.id === task.cardId)?.title : undefined}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TaskDetailModal
        task={editingTask}
        cards={cards}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={updateTask}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        linkedCardTitle={selectedCard?.title}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateTask}
      />
    </div>
  );
}
