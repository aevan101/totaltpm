'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button, Select, LinksEditor } from '@/components/ui';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/constants';
import type { Task, TaskStatus, TaskPriority, KanbanCard, LinkAttachment } from '@/types';

interface TaskDetailModalProps {
  task: Task | null;
  cards: KanbanCard[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => void;
}

export function TaskDetailModal({ task, cards, isOpen, onClose, onSave }: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('p2');
  const [dueDate, setDueDate] = useState('');
  const [cardId, setCardId] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkAttachment[]>([]);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setCardId(task.cardId ?? null);
      setLinks(task.links ?? []);
      setComments(task.comments ?? '');
    }
  }, [task]);

  const handleSave = () => {
    if (task && title.trim()) {
      onSave(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate + 'T12:00:00').getTime() : undefined,
        cardId,
        links,
        comments: comments.trim() || undefined,
      });
      onClose();
    }
  };

  const statusOptions = Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const priorityOptions = Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const cardOptions = [
    { value: '', label: 'None' },
    ...cards.map((card) => ({ value: card.id, label: card.title })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="flex flex-col gap-3"
      >
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          autoFocus
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          rows={2}
        />
        <div className="grid grid-cols-4 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            options={statusOptions}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={priorityOptions}
          />
          <Input
            type="date"
            label="Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Select
            label="Deliverable"
            value={cardId ?? ''}
            onChange={(e) => setCardId(e.target.value || null)}
            options={cardOptions}
          />
        </div>
        <Textarea
          label="Comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add notes or comments..."
          rows={2}
        />
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Attached Links
          </label>
          <LinksEditor links={links} onChange={setLinks} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
