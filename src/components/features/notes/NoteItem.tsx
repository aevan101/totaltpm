'use client';

import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils';
import type { Note } from '@/types';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
}

export function NoteItem({ note, isSelected, onClick }: NoteItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 border-b border-neutral-200 transition-colors',
        'hover:bg-neutral-50',
        isSelected && 'bg-neutral-100'
      )}
    >
      <h4 className="text-sm font-medium text-neutral-900 truncate">{note.title}</h4>
      <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
        {note.content || 'No content'}
      </p>
      <span className="mt-2 block text-xs text-neutral-400">
        {formatRelativeDate(note.updatedAt)}
      </span>
    </button>
  );
}
