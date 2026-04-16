'use client';

import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  /** Section title (will be displayed uppercase) */
  title: string;
  /** Optional action element (e.g., "+ Add" button) */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SectionHeader - Uppercase label with optional action
 * Used for sidebar sections like "WHO IS SIGNING?" and "DRAG & DROP FIELDS"
 */
export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <h3 className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
        {title}
      </h3>
      {action}
    </div>
  );
}

export default SectionHeader;
