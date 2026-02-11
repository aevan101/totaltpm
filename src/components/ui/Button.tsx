'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors rounded-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-neutral-900 text-white hover:bg-neutral-800': variant === 'primary',
            'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50': variant === 'secondary',
            'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          },
          {
            'text-sm px-3 py-1.5': size === 'sm',
            'text-sm px-5 py-2.5': size === 'md',
            'text-base px-9 py-4.5': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
