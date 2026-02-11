'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button, Select, LinksEditor } from '@/components/ui';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/constants';
import type { TaskStatus, TaskPriority, KanbanCard, LinkAttachment } from '@/types';

interface CreateTaskModalProps {
  isOpen: boolean;
  cards: KanbanCard[];
  selectedCardId?: string;
  onClose: () => void;
  onSave: (data: { title: string; description?: string; status?: TaskStatus; priority: TaskPriority; dueDate?: number; cardId?: string; links?: LinkAttachment[]; comments?: string }) => void;
}

export function CreateTaskModal({ isOpen, cards, selectedCardId, onClose, onSave }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('p2');
  const [dueDate, setDueDate] = useState('');
  const [cardId, setCardId] = useState('');
  const [links, setLinks] = useState<LinkAttachment[]>([]);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCardId(selectedCardId ?? '');
    }
  }, [isOpen, selectedCardId]);

  const handleSave = () => {
    if (title.trim()) {
      onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate + 'T12:00:00').getTime() : undefined,
        cardId: cardId || undefined,
        links: links.length > 0 ? links : undefined,
        comments: comments.trim() || undefined,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('p2');
    setDueDate('');
    setCardId('');
    setLinks([]);
    setComments('');
    onClose();
  };

  const statusOptions = Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const priorityOptions = Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const deliverableOptions = [
    { value: '', label: 'None' },
    ...cards.map((card) => ({ value: card.id, label: card.title })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Task" size="md">
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
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            options={deliverableOptions}
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
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
