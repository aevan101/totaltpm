'use client';

import { Modal, Button, Badge } from '@/components/ui';
import { TASK_PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { KanbanCard } from '@/types';

interface ArchiveModalProps {
  isOpen: boolean;
  archivedCards: KanbanCard[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ArchiveModal({ isOpen, archivedCards, onClose, onRestore, onDelete }: ArchiveModalProps) {
  const handleDelete = (cardId: string) => {
    onDelete(cardId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Archived Deliverables" size="lg">
      {archivedCards.length === 0 ? (
        <div className="text-center text-sm text-neutral-400 py-12">
          No archived deliverables
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {archivedCards.map((card) => (
            <div
              key={card.id}
              className="border border-neutral-200 rounded-md p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-neutral-900 truncate">{card.title}</h4>
                  <Badge className={card.archiveReason === 'deleted' ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-500'}>
                    {card.archiveReason === 'deleted' ? 'Deleted' : 'Archived'}
                  </Badge>
                  {card.priority && (
                    <Badge className={PRIORITY_COLORS[card.priority]}>
                      {TASK_PRIORITY_LABELS[card.priority]}
                    </Badge>
                  )}
                </div>
                {card.archivedAt && (
                  <p className="text-xs text-neutral-400 mt-1">
                    {card.archiveReason === 'deleted' ? 'Deleted' : 'Archived'} {formatDate(card.archivedAt)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" onClick={() => onRestore(card.id)}>
                  Restore
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(card.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
