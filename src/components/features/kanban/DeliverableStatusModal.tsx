'use client';

import { useState, useMemo } from 'react';
import { Modal, Button, Badge } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import { TASK_PRIORITY_LABELS, PRIORITY_COLORS, TASK_STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import type { KanbanCard, Task } from '@/types';

interface DeliverableStatusModalProps {
  card: KanbanCard | null;
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
}

export function DeliverableStatusModal({ card, tasks, isOpen, onClose }: DeliverableStatusModalProps) {
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => {
    if (!card) return null;

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const now = Date.now();

    // Recently completed tasks (done tasks, sorted by most recently updated)
    const recentlyCompleted = tasks
      .filter((t) => t.status === 'done')
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3);

    // Upcoming due dates (non-done tasks with due dates in the future)
    const upcoming = tasks
      .filter((t) => t.status !== 'done' && t.dueDate && t.dueDate > now)
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0))
      .slice(0, 3);

    // Overdue tasks (non-done tasks with due dates in the past)
    const overdue = tasks
      .filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < now);

    // High priority items (P0 or P1, not done)
    const highPriority = tasks
      .filter((t) => t.status !== 'done' && (t.priority === 'p0' || t.priority === 'p1'));

    return {
      total,
      completed,
      inProgress,
      todo,
      percentage,
      recentlyCompleted,
      upcoming,
      overdue,
      highPriority,
    };
  }, [card, tasks]);

  const generateParagraph = (): string => {
    if (!card || !summary) return '';

    const parts: string[] = [];

    if (summary.total === 0) {
      parts.push(`${card.title} has no linked tasks yet.`);
    } else {
      parts.push(
        `${card.title} is ${summary.percentage}% complete with ${summary.completed} of ${summary.total} task${summary.total !== 1 ? 's' : ''} done.`
      );

      const statusParts: string[] = [];
      if (summary.inProgress > 0) {
        statusParts.push(`${summary.inProgress} task${summary.inProgress !== 1 ? 's are' : ' is'} in progress`);
      }
      if (summary.todo > 0) {
        statusParts.push(`${summary.todo} ${summary.todo !== 1 ? 'are' : 'is'} still to do`);
      }
      if (statusParts.length > 0) {
        parts.push(statusParts.join(' and ') + '.');
      }

      if (summary.overdue.length > 0) {
        parts.push(`There ${summary.overdue.length === 1 ? 'is' : 'are'} ${summary.overdue.length} overdue task${summary.overdue.length !== 1 ? 's' : ''}.`);
      }
    }

    return parts.join(' ');
  };

  const generateBulletPoints = (): string[] => {
    if (!summary) return [];

    const bullets: string[] = [];

    for (const task of summary.recentlyCompleted) {
      bullets.push(`Completed "${task.title}" on ${formatDate(task.updatedAt)}`);
    }

    for (const task of summary.upcoming) {
      bullets.push(`Upcoming: "${task.title}" due ${formatDate(task.dueDate!)}`);
    }

    for (const task of summary.overdue) {
      bullets.push(`Overdue: "${task.title}" was due ${formatDate(task.dueDate!)}`);
    }

    for (const task of summary.highPriority) {
      bullets.push(`${TASK_PRIORITY_LABELS[task.priority]} priority: "${task.title}" (${TASK_STATUS_LABELS[task.status]})`);
    }

    return bullets;
  };

  const generatePlainText = (): string => {
    const paragraph = generateParagraph();
    const bullets = generateBulletPoints();

    let text = paragraph;
    if (bullets.length > 0) {
      text += '\n\n';
      text += bullets.map((b) => `- ${b}`).join('\n');
    }
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = generatePlainText();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!card || !summary) return null;

  const paragraph = generateParagraph();
  const bullets = generateBulletPoints();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deliverable Status" size="md">
      <div className="flex flex-col gap-4">
        {/* Card Title & Copy Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">{card.title}</h3>
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 mr-1.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy Summary
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm text-neutral-600 mb-1.5">
            <span>{summary.completed}/{summary.total} tasks complete</span>
            <span className="font-medium">{summary.percentage}%</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                summary.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${summary.percentage}%` }}
            />
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="flex gap-2">
          <Badge className={cn(STATUS_COLORS['done'], 'text-xs')}>
            {summary.completed} Done
          </Badge>
          <Badge className={cn(STATUS_COLORS['in-progress'], 'text-xs')}>
            {summary.inProgress} In Progress
          </Badge>
          <Badge className={cn(STATUS_COLORS['todo'], 'text-xs')}>
            {summary.todo} To Do
          </Badge>
        </div>

        {/* Written Summary */}
        <div className="bg-neutral-50 rounded-md p-3">
          <p className="text-sm text-neutral-700 leading-relaxed">{paragraph}</p>
        </div>

        {/* Key Bullet Points */}
        {bullets.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-2">Key Details</h4>
            <ul className="flex flex-col gap-1.5">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={cn(
                    'mt-1.5 w-1.5 h-1.5 rounded-full shrink-0',
                    bullet.startsWith('Overdue') ? 'bg-red-500' :
                    bullet.startsWith('Completed') ? 'bg-green-500' :
                    bullet.startsWith('Upcoming') ? 'bg-blue-500' :
                    'bg-orange-500'
                  )} />
                  <span className={cn(
                    'text-neutral-600',
                    bullet.startsWith('Overdue') && 'text-red-600 font-medium'
                  )}>
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state when no tasks */}
        {summary.total === 0 && (
          <div className="text-center py-4">
            <svg className="w-10 h-10 mx-auto text-neutral-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            <p className="text-sm text-neutral-400">No tasks linked to this card yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Link tasks from the Tasks panel to see progress here.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
