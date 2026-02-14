'use client';

import { useState, useRef, useCallback, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/context/AppContext';
import { useTasks } from '@/hooks/useTasks';
import { TaskItem } from './TaskItem';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { AddButton, Input, Select, Modal, Button, Badge } from '@/components/ui';
import { TASK_PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority } from '@/types';

interface TaskDragState {
  task: Task;
  offsetY: number;
  width: number;
  left: number;
  y: number;
  targetIndex: number;
}

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
  const [dragState, setDragState] = useState<TaskDragState | null>(null);

  // Get selected card for display
  const selectedCard = selectedCardId ? projectCards.find((c) => c.id === selectedCardId) : null;

  const { tasks, addTask, updateTask, deleteTask, reorderTasks } = useTasks({
    status: statusFilter,
    search: searchFilter,
    cardId: selectedCardId ?? undefined,
  });

  // Drag refs
  const dragRef = useRef<TaskDragState | null>(null);
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const didDragRef = useRef(false);

  const canDrag = !selectedCardId; // Disable drag when filtering by deliverable

  // Task item ref callback
  const setTaskRef = useCallback((taskId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      taskRefs.current.set(taskId, el);
    } else {
      taskRefs.current.delete(taskId);
    }
  }, []);

  // Hit-test: determine target index based on pointer Y
  const getTargetIndex = useCallback((clientY: number, draggedTaskId: string): number => {
    const entries: { id: string; midY: number }[] = [];
    for (const [id, el] of taskRefs.current) {
      if (id === draggedTaskId) continue;
      const rect = el.getBoundingClientRect();
      entries.push({ id, midY: rect.top + rect.height / 2 });
    }
    // Sort by vertical position
    entries.sort((a, b) => a.midY - b.midY);

    // Find insertion index
    for (let i = 0; i < entries.length; i++) {
      if (clientY < entries[i].midY) return i;
    }
    return entries.length;
  }, []);

  // Drag initiation
  const handleTaskPointerDown = useCallback((e: PointerEvent, task: Task) => {
    if (e.button !== 0 || !canDrag) return;

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) return;

    const taskEl = e.currentTarget as HTMLElement;
    const rect = taskEl.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const width = rect.width;
    const left = rect.left;
    const startX = e.clientX;
    const startY = e.clientY;

    didDragRef.current = false;
    let started = false;

    const handleMove = (moveE: globalThis.PointerEvent) => {
      if (!started) {
        const dx = moveE.clientX - startX;
        const dy = moveE.clientY - startY;
        if (Math.sqrt(dx * dx + dy * dy) < 5) return;
        started = true;
        didDragRef.current = true;
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        window.getSelection()?.removeAllRanges();
      }

      const targetIndex = getTargetIndex(moveE.clientY, task.id);

      const state: TaskDragState = {
        task,
        offsetY,
        width,
        left,
        y: moveE.clientY,
        targetIndex,
      };

      dragRef.current = state;
      setDragState(state);
    };

    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);

      const current = dragRef.current;
      if (started && current) {
        // Build reordered task ID array
        const currentIds = tasks.map((t) => t.id);
        const draggedId = current.task.id;
        const without = currentIds.filter((id) => id !== draggedId);
        without.splice(current.targetIndex, 0, draggedId);
        reorderTasks(without);
      }

      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';

      dragRef.current = null;
      setDragState(null);

      if (started) {
        setTimeout(() => { didDragRef.current = false; }, 50);
      }
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  }, [canDrag, getTargetIndex, tasks, reorderTasks]);

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

  const handleEditTask = (task: Task) => {
    if (!didDragRef.current) {
      setEditingTask(task);
    }
  };

  const handleCreateTask = (data: { title: string; description?: string; status?: import('@/types').TaskStatus; priority: TaskPriority; dueDate?: number; cardId?: string; links?: import('@/types').LinkAttachment[]; comments?: string }) => {
    addTask(data.title, {
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      cardId: data.cardId,
      links: data.links,
      comments: data.comments,
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
            {(() => {
              // Build list of non-dragged tasks to compute insertion position
              const visibleTasks = dragState
                ? tasks.filter((t) => t.id !== dragState.task.id)
                : tasks;
              const elements: React.ReactNode[] = [];

              visibleTasks.forEach((task, i) => {
                // Insert drop indicator before this task if it's the target position
                if (dragState && dragState.targetIndex === i) {
                  elements.push(
                    <div
                      key="drop-indicator"
                      className="transition-all duration-200 ease-out"
                      style={{ height: 6, marginTop: -2, marginBottom: -2 }}
                    >
                      <div className="h-0.5 bg-blue-400 rounded-full mx-1" />
                    </div>
                  );
                }

                elements.push(
                  <TaskItem
                    key={task.id}
                    ref={setTaskRef(task.id)}
                    task={task}
                    cardTitle={task.cardId ? projectCards.find((c) => c.id === task.cardId)?.title : undefined}
                    isBeingDragged={dragState?.task.id === task.id}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onToggleStatus={handleToggleStatus}
                    onDragStart={canDrag ? handleTaskPointerDown : undefined}
                  />
                );
              });

              // Insert drop indicator at the end if target is after all items
              if (dragState && dragState.targetIndex >= visibleTasks.length) {
                elements.push(
                  <div
                    key="drop-indicator"
                    className="transition-all duration-200 ease-out"
                    style={{ height: 6, marginTop: -2, marginBottom: -2 }}
                  >
                    <div className="h-0.5 bg-blue-400 rounded-full mx-1" />
                  </div>
                );
              }

              return elements;
            })()}
          </div>
        )}
      </div>

      {/* Drag overlay */}
      {dragState && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            left: dragState.left,
            top: dragState.y - dragState.offsetY,
            width: dragState.width,
            transform: 'rotate(2deg) scale(1.02)',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.08)',
            borderRadius: '0.375rem',
            overflow: 'hidden',
            transition: 'transform 0.1s ease',
          }}
        >
          <div
            className="bg-white border-2 border-neutral-200 rounded-md"
            style={{ padding: '10px 14px' }}
          >
            <h4 className="text-sm font-medium text-neutral-900">{dragState.task.title}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge className={cn(PRIORITY_COLORS[dragState.task.priority], 'text-[10px] px-1.5 py-0')}>
                {TASK_PRIORITY_LABELS[dragState.task.priority]}
              </Badge>
            </div>
          </div>
        </div>,
        document.body
      )}

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
