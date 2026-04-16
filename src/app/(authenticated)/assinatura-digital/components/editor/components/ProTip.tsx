'use client';

import { cn } from '@/lib/utils';

interface ProTipProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ProTip - Contextual tip component using highlight color from design system
 * Uses --highlight token (Action Orange) for visual emphasis
 */
export function ProTip({ children, className }: ProTipProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg',
        'bg-chart-2/10', // Using chart-2 (highlight/orange) with opacity
        className
      )}
    >
      {/* Orange dot indicator */}
      <div className="h-5 w-5 rounded-full bg-chart-2 flex items-center justify-center shrink-0">
        <span className="h-2 w-2 rounded-full bg-white" />
      </div>
      <p className="text-sm text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

/**
 * ProTip label component for inline usage
 */
export function ProTipLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-medium text-chart-2">
      {children}
    </span>
  );
}

/**
 * Keyboard shortcut badge for ProTip content
 */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
      {children}
    </kbd>
  );
}

export default ProTip;
