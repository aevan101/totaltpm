'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button, Select, LinksEditor } from '@/components/ui';
import { TASK_PRIORITY_LABELS } from '@/lib/constants';
import type { TaskPriority, KanbanCard, LinkAttachment } from '@/types';

interface CreateTaskModalProps {
  isOpen: boolean;
  cards: KanbanCard[];
  selectedCardId?: string;
  onClose: () => void;
  onSave: (data: { title: string; description?: string; priority: TaskPriority; dueDate?: number; cardId?: string; links?: LinkAttachment[] }) => void;
}

export function CreateTaskModal({ isOpen, cards, selectedCardId, onClose, onSave }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('p2');
  const [dueDate, setDueDate] = useState('');
  const [cardId, setCardId] = useState('');
  const [links, setLinks] = useState<LinkAttachment[]>([]);

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
        priority,
        dueDate: dueDate ? new Date(dueDate + 'T12:00:00').getTime() : undefined,
        cardId: cardId || undefined,
        links: links.length > 0 ? links : undefined,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('p2');
    setDueDate('');
    setCardId('');
    setLinks([]);
    onClose();
  };

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
        <div className="grid grid-cols-3 gap-3">
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
