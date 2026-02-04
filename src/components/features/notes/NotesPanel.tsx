'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useNotes } from '@/hooks/useNotes';
import { NoteEditor } from './NoteEditor';
import { AddButton, Input } from '@/components/ui';
import { formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function NotesPanel() {
  const { selectedCardId, cards, columns, currentProjectId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Get current project's columns and cards
  const projectColumnIds = columns.filter((c) => c.projectId === currentProjectId).map((c) => c.id);
  const projectCards = cards.filter((c) => projectColumnIds.includes(c.columnId));

  // Get selected card for display
  const selectedCard = selectedCardId ? projectCards.find((c) => c.id === selectedCardId) : null;

  const { notes, addNote, updateNote, deleteNote } = useNotes(searchQuery, selectedCardId ?? undefined);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  useEffect(() => {
    if (selectedNoteId && !notes.find((n) => n.id === selectedNoteId)) {
      setSelectedNoteId(notes.length > 0 ? notes[0].id : null);
    }
  }, [notes, selectedNoteId]);

  const handleCreateNote = () => {
    const newNote = addNote('Untitled', '', selectedCardId);  // Auto-link to selected card
    if (newNote) {
      setSelectedNoteId(newNote.id);
    }
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    if (selectedNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Extract plain text preview from HTML content
  const getPreview = (content: string) => {
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.slice(0, 60) + (text.length > 60 ? '...' : '');
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Notes List Sidebar */}
      <div className="w-64 bg-neutral-50/80 flex flex-col shrink-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">Notes</h2>
          <AddButton label="Add note" onClick={handleCreateNote} style={{ marginRight: '5px' }} />
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full px-3 py-1.5 text-sm bg-neutral-200/50 rounded-lg placeholder:text-neutral-400 focus:outline-none focus:bg-neutral-200/80 transition-colors"
          />
        </div>

        {selectedCard && (
          <div className="px-4 pb-2">
            <span className="text-xs text-blue-600">
              Linked to {selectedCard.title}
            </span>
          </div>
        )}

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {notes.length === 0 ? (
            <div className="text-center text-sm text-neutral-400 py-8 px-2">
              {searchQuery
                ? 'No matches'
                : selectedCard
                  ? 'No linked notes'
                  : 'No notes yet'}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg transition-all',
                    selectedNoteId === note.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'hover:bg-neutral-200/60'
                  )}
                >
                  <div className={cn(
                    'text-sm font-medium truncate',
                    selectedNoteId === note.id ? 'text-white' : 'text-neutral-900'
                  )}>
                    {note.title || 'Untitled'}
                  </div>
                  <div className={cn(
                    'text-xs mt-0.5 flex items-center gap-2',
                    selectedNoteId === note.id ? 'text-blue-100' : 'text-neutral-400'
                  )}>
                    <span>{formatRelativeDate(note.updatedAt)}</span>
                    {note.content && (
                      <>
                        <span>·</span>
                        <span className="truncate">{getPreview(note.content)}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="flex-1 min-w-0 bg-white">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            cards={projectCards}
            onSave={updateNote}
            onDelete={handleDeleteNote}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-neutral-400">
            {notes.length === 0
              ? 'Create a note to get started'
              : 'Select a note'}
          </div>
        )}
      </div>
    </div>
  );
}
