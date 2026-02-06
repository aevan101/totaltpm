'use client';

import { useState } from 'react';
import { Button, Input, IconButton } from '@/components/ui';
import type { LinkAttachment } from '@/types';

interface LinksEditorProps {
  links: LinkAttachment[];
  onChange: (links: LinkAttachment[]) => void;
  compact?: boolean;
}

export function LinksEditor({ links, onChange, compact = false }: LinksEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const handleAddLink = () => {
    if (newUrl.trim()) {
      // Ensure URL has protocol
      let url = newUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      onChange([...links, { url, title: newTitle.trim() || undefined }]);
      setNewUrl('');
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const handleRemoveLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-2">
      {/* Existing links */}
      {links.length > 0 && (
        <div className="space-y-1.5">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md group"
            >
              <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 text-sm text-blue-600 hover:text-blue-700 hover:underline truncate"
              >
                {link.title || getDomain(link.url)}
              </a>
              <span className="text-xs text-neutral-400 hidden group-hover:block">
                {getDomain(link.url)}
              </span>
              <IconButton
                variant="danger"
                size="sm"
                label="Remove link"
                onClick={() => handleRemoveLink(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            </div>
          ))}
        </div>
      )}

      {/* Add link form */}
      {isAdding ? (
        <div className="space-y-2 p-3 bg-neutral-50 border border-neutral-200 rounded-md">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLink();
              }
              if (e.key === 'Escape') {
                setNewUrl('');
                setNewTitle('');
                setIsAdding(false);
              }
            }}
          />
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Link title (optional)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLink();
              }
              if (e.key === 'Escape') {
                setNewUrl('');
                setNewTitle('');
                setIsAdding(false);
              }
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddLink} disabled={!newUrl.trim()}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNewUrl('');
                setNewTitle('');
                setIsAdding(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className={compact ? 'text-neutral-500' : 'w-full justify-start text-neutral-500'}
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          Add link
        </Button>
      )}
    </div>
  );
}
