'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button, Select } from '@/components/ui';
import { TASK_PRIORITY_LABELS } from '@/lib/constants';
import type { KanbanCard, TaskPriority } from '@/types';

interface CardDetailModalProps {
  card: KanbanCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { title: string; description?: string; priority?: TaskPriority }) => void;
}

export function CardDetailModal({ card, isOpen, onClose, onSave }: CardDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('p2');

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description ?? '');
      setPriority(card.priority ?? 'p2');
    }
  }, [card]);

  const priorityOptions = Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const handleSave = () => {
    if (card && title.trim()) {
      onSave(card.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Card" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="flex flex-col gap-4"
      >
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Card title"
          autoFocus
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          rows={4}
        />
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          options={priorityOptions}
        />
        <div className="flex justify-end gap-2 pt-2">
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
