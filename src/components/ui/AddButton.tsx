'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AddButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export const AddButton = forwardRef<HTMLButtonElement, AddButtonProps>(
  ({ className, label = 'Add', ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex items-center justify-center h-4 w-4 rounded-full',
          'bg-neutral-400 text-white hover:bg-neutral-500',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          className
        )}
        {...props}
      >
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    );
  }
);

AddButton.displayName = 'AddButton';
