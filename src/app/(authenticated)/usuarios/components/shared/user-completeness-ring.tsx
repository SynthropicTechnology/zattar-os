'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getCompletenessColor } from './completeness-utils';

interface UserCompletenessRingProps {
  score: number; // 0-100
  size?: number; // px diameter, default 60
  strokeWidth?: number; // default 2
  className?: string;
}

const STROKE_COLOR_MAP = {
  success: 'stroke-success',
  warning: 'stroke-warning',
  destructive: 'stroke-destructive',
} as const;

export function UserCompletenessRing({
  score,
  size = 60,
  strokeWidth = 2,
  className,
}: UserCompletenessRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const colorKey = getCompletenessColor(score);
  const strokeColorClass = STROKE_COLOR_MAP[colorKey];

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn(
        'absolute top-0 left-0 pointer-events-none',
        className,
      )}
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-border/10"
      />
      {/* Progress circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={cn('transition-all duration-700', strokeColorClass)}
      />
    </svg>
  );
}
