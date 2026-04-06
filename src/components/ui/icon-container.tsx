import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Icon container sizes from the design system (ICON_CONTAINER in tokens.ts).
 * Provides consistent sizing and rounding for icons inside colored backgrounds.
 *
 * @ai-context ALWAYS use this component for icons with colored backgrounds.
 * NEVER compose `size-10 rounded-xl flex items-center justify-center` manually.
 */
const ICON_CONTAINER_SIZES = {
  /** 40px — cards de processo, entidades */
  lg: 'size-10 rounded-xl',
  /** 32px — listas, rows de tabela */
  md: 'size-8 rounded-lg',
  /** 24px — inline, badges */
  sm: 'size-6 rounded-md',
  /** 20px — indicators, dots */
  xs: 'size-5 rounded',
} as const;

type IconContainerSize = keyof typeof ICON_CONTAINER_SIZES;

interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the container */
  size: IconContainerSize;
  children: React.ReactNode;
}

/**
 * IconContainer — Typed container for icons with colored backgrounds.
 *
 * @example
 * <IconContainer size="lg" className="bg-primary/8">
 *   <Scale className="size-5 text-primary/70" />
 * </IconContainer>
 *
 * <IconContainer size="md" className="bg-success/10">
 *   <CheckCircle className="size-4 text-success" />
 * </IconContainer>
 */
function IconContainer({ size, className, children, ...props }: IconContainerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0',
        ICON_CONTAINER_SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
IconContainer.displayName = 'IconContainer';

export { IconContainer, ICON_CONTAINER_SIZES };
export type { IconContainerSize };
