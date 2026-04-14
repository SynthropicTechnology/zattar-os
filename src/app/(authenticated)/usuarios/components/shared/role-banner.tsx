'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RoleBannerProps {
  cargoNome: string | null | undefined;
  inactive?: boolean;
  height?: string; // default 'h-14'
  className?: string;
}

const GRADIENT_MAP: Array<[RegExp, string]> = [
  [/diretor/i, 'from-primary/40 to-primary/15'],
  [/advogad[oa]/i, 'from-info/35 to-info/12'],
  [/estagiári[oa]/i, 'from-success/35 to-success/12'],
  [/secretári[oa]/i, 'from-warning/35 to-warning/12'],
];

const DEFAULT_GRADIENT = 'from-border/10 to-border/4';

export function getRoleBannerGradient(
  cargoNome: string | null | undefined,
): string {
  if (!cargoNome) return DEFAULT_GRADIENT;
  const trimmed = cargoNome.trim();
  for (const [pattern, gradient] of GRADIENT_MAP) {
    if (pattern.test(trimmed)) return gradient;
  }
  return DEFAULT_GRADIENT;
}

export function RoleBanner({
  cargoNome,
  inactive = false,
  height = 'h-14',
  className,
}: RoleBannerProps) {
  const gradient = getRoleBannerGradient(cargoNome);

  return (
    <div
      className={cn(
        'bg-linear-to-br relative w-full overflow-hidden',
        gradient,
        height,
        inactive && 'grayscale',
        className,
      )}
    >
      {/* Bottom overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background/60" />
    </div>
  );
}
