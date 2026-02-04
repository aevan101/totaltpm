'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useNotes } from '@/hooks/useNotes';
import { NoteItem } from './NoteItem';
import { NoteEditor } from './NoteEditor';
import { Button, Input, EmptyState } from '@/components/ui';
import type { Note } from '@/types';

export function NotesList() {
  const { cards, columns, currentProjectId, selectedCardId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { notes, addNote, updateNote, deleteNote } = useNotes(searchQuery, selectedCardId ?? undefined);

  // Get current project's columns and cards
  const projectColumnIds = columns.filter((c) => c.projectId === currentProjectId).map((c) => c.id);
  const projectCards = cards.filter((c) => projectColumnIds.includes(c.columnId));

  // Get selected card for display
  const selectedCard = selectedCardId ? projectCards.find((c) => c.id === selectedCardId) : null;

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  // Auto-select first note if current selection is deleted
  useEffect(() => {
    if (selectedNoteId && !notes.find((n) => n.id === selectedNoteId)) {
      setSelectedNoteId(notes.length > 0 ? notes[0].id : null);
    }
  }, [notes, selectedNoteId]);

  const handleCreateNote = () => {
    const newNote = addNote('Untitled', '', selectedCardId);
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

  if (notes.length === 0 && !searchQuery) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
          title="No notes yet"
          description="Create your first note to start capturing ideas and information."
          action={
            <Button onClick={handleCreateNote}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Note
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      {/* Notes List Sidebar */}
      <div className="w-72 border-r border-neutral-200 bg-white flex flex-col shrink-0">
        {/* Search & Create */}
        <div className="p-3 border-b border-neutral-200">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="flex-1"
            />
            <Button size="sm" onClick={handleCreateNote}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="p-4 text-sm text-neutral-500 text-center">
              No notes found
            </div>
          ) : (
            notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                onClick={() => setSelectedNoteId(note.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="flex-1 bg-white">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            cards={projectCards}
            onSave={updateNote}
            onDelete={handleDeleteNote}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center h-full text-neutral-400">
            {selectedCard ? `Select or create a note for "${selectedCard.title}"` : 'Select a note to view'}
          </div>
        )}
      </div>
    </div>
  );
}
