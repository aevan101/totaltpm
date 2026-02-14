'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IconButton, Select, LinksEditor } from '@/components/ui';
import type { Note, KanbanCard, LinkAttachment } from '@/types';

interface NoteEditorProps {
  note: Note;
  cards: KanbanCard[];
  onSave: (id: string, updates: { title?: string; content?: string; cardId?: string | null; links?: LinkAttachment[] }) => void;
  onDelete: (id: string) => void;
}

export function NoteEditor({ note, cards, onSave, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [cardId, setCardId] = useState<string | null>(note.cardId ?? null);
  const [links, setLinks] = useState<LinkAttachment[]>(note.links ?? []);
  const [showLinks, setShowLinks] = useState(false);
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    unorderedList: false,
    orderedList: false,
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const editorRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const prevNoteIdRef = useRef<string | null>(null);

  // Update local state when note changes (but not content - that's handled separately)
  useEffect(() => {
    setTitle(note.title);
    setCardId(note.cardId ?? null);
    setLinks(note.links ?? []);
  }, [note.title, note.cardId, note.links]);

  // Only update editor content when switching to a different note
  useEffect(() => {
    if (editorRef.current && note.id !== prevNoteIdRef.current) {
      editorRef.current.innerHTML = note.content || '';
      prevNoteIdRef.current = note.id;
    }
  }, [note.id, note.content]);

  const cardOptions = [
    { value: '', label: 'No deliverable' },
    ...cards.map((card) => ({ value: card.id, label: card.title })),
  ];

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debounceSave(newTitle);
  };

  const debounceSave = useCallback((newTitle?: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const content = editorRef.current?.innerHTML || '';
      onSave(note.id, {
        title: newTitle ?? title,
        content
      });
    }, 500);
  }, [note.id, title, onSave]);

  const handleContentChange = () => {
    debounceSave();
    updateFormatState();
  };

  const updateFormatState = useCallback(() => {
    setFormatState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
      orderedList: document.queryCommandState('insertOrderedList'),
    });
  }, []);

  const handleSelectionChange = useCallback(() => {
    // Only update if selection is within our editor
    const selection = window.getSelection();
    if (selection && editorRef.current?.contains(selection.anchorNode)) {
      updateFormatState();
    }
  }, [updateFormatState]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Close links dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (linksRef.current && !linksRef.current.contains(e.target as Node)) {
        setShowLinks(false);
      }
    };
    if (showLinks) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLinks]);

  const handleCardIdChange = (newCardId: string | null) => {
    setCardId(newCardId);
    onSave(note.id, { cardId: newCardId });
  };

  const handleLinksChange = (newLinks: LinkAttachment[]) => {
    setLinks(newLinks);
    onSave(note.id, { links: newLinks });
  };

  const handleDelete = () => {
    // Clear any pending save so it doesn't fire after deletion
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    onDelete(note.id);
  };

  const execCommand = (command: string, value?: string) => {
    // Save selection
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    // Ensure editor is focused
    editorRef.current?.focus();

    // Restore selection if it was in our editor
    if (range && editorRef.current?.contains(range.commonAncestorContainer)) {
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    document.execCommand(command, false, value);
    handleContentChange();
    updateFormatState();
  };

  const formatBold = () => execCommand('bold');
  const formatItalic = () => execCommand('italic');
  const formatBulletList = () => execCommand('insertUnorderedList');
  const formatNumberedList = () => execCommand('insertOrderedList');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'b') {
        e.preventDefault();
        formatBold();
        return;
      }
      if (e.key === 'i') {
        e.preventDefault();
        formatItalic();
        return;
      }
    }
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (selection?.anchorNode) {
        const text = selection.anchorNode.textContent || '';
        const offset = selection.anchorOffset;
        // "- " at the start of a line triggers bullet list
        if (text.substring(0, offset) === '-') {
          e.preventDefault();
          // Remove the "-" character
          const range = document.createRange();
          range.setStart(selection.anchorNode, 0);
          range.setEnd(selection.anchorNode, offset);
          range.deleteContents();
          document.execCommand('insertUnorderedList', false);
          handleContentChange();
          return;
        }
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand('outdent', false);
      } else {
        document.execCommand('indent', false);
      }
      handleContentChange();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ padding: '5px' }}>
      {/* Header - subtle, Apple-like */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <Select
            value={cardId ?? ''}
            onChange={(e) => handleCardIdChange(e.target.value || null)}
            options={cardOptions}
            className="w-40 text-sm"
          />
          {/* Formatting Controls - subtle, Apple-like */}
          <div className="flex items-center gap-0.5 ml-3">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={formatBold}
              className={`p-1.5 rounded-md transition-all ${
                formatState.bold
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600'
              }`}
              title="Bold"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z" stroke="currentColor" strokeWidth={1.5} fill="none" />
              </svg>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={formatItalic}
              className={`p-1.5 rounded-md transition-all ${
                formatState.italic
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600'
              }`}
              title="Italic"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>
            <div className="w-px h-3.5 bg-neutral-200 mx-1.5" />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={formatBulletList}
              className={`p-1.5 rounded-md transition-all ${
                formatState.unorderedList
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600'
              }`}
              title="Bullet List"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="9" y1="6" x2="20" y2="6" />
                <line x1="9" y1="12" x2="20" y2="12" />
                <line x1="9" y1="18" x2="20" y2="18" />
                <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                <circle cx="4" cy="18" r="1.5" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={formatNumberedList}
              className={`p-1.5 rounded-md transition-all ${
                formatState.orderedList
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600'
              }`}
              title="Numbered List"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="10" y1="6" x2="20" y2="6" />
                <line x1="10" y1="12" x2="20" y2="12" />
                <line x1="10" y1="18" x2="20" y2="18" />
                <text x="3" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="system-ui">1</text>
                <text x="3" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="system-ui">2</text>
                <text x="3" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="system-ui">3</text>
              </svg>
            </button>
            <div className="w-px h-3.5 bg-neutral-200 mx-1.5" />
            {/* Links Button */}
            <div className="relative" ref={linksRef}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowLinks(!showLinks)}
                className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${
                  showLinks || links.length > 0
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600'
                }`}
                title="Attached Links"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                {links.length > 0 && (
                  <span className="text-xs font-medium">{links.length}</span>
                )}
              </button>
              {showLinks && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-md shadow-xl border border-neutral-100 p-4 z-50">
                  <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Attached Links</div>
                  <LinksEditor links={links} onChange={handleLinksChange} compact />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            variant="danger"
            size="sm"
            label="Delete note"
            onClick={handleDelete}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pt-3">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Untitled"
          className="w-full text-lg font-semibold text-neutral-800 placeholder:text-neutral-300 focus:outline-none tracking-tight"
        />
      </div>

      {/* Content - Rich Text Editor */}
      <div className="flex-1 px-4 py-2 overflow-y-auto overflow-x-hidden border-0 outline-none">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full text-sm text-neutral-600 leading-relaxed min-h-[200px]"
          data-placeholder="Start writing..."
          style={{ outline: 'none', border: 'none', WebkitTapHighlightColor: 'transparent' }}
        />
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #d4d4d4;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
