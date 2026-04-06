import * as React from 'react';
import Link from 'next/link';
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Heading } from '@/components/ui/typography';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  icon?: LucideIcon;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  href?: string;
  className?: string;
  footer?: React.ReactNode;
}

const trendIcons: Record<NonNullable<MetricCardProps['trendDirection']>, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors: Record<NonNullable<MetricCardProps['trendDirection']>, string> = {
  up: 'text-success',
  down: 'text-destructive',
  neutral: 'text-muted-foreground',
};

function MetricCardContent({
  title,
  icon: Icon,
  value,
  trend,
  trendDirection,
  footer,
}: Omit<MetricCardProps, 'href' | 'className'>) {
  const TrendIcon = trendDirection ? trendIcons[trendDirection] : null;

  // Format monetary values
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (typeof val === 'string' && val.startsWith('R$')) {
      const parts = val.replace(/[^\d,.-]/g, '').split(',');
      if (parts.length === 2) {
        return (
          <>
            <span className="text-2xl font-bold font-heading text-foreground tabular-nums">
              {parts[0]}
            </span>
            <span className="text-base font-semibold font-heading text-muted-foreground tabular-nums">
              ,{parts[1]}
            </span>
          </>
        );
      }
    }
    return (
      <span className="text-2xl font-bold font-heading text-foreground tabular-nums">
        {val}
      </span>
    );
  };

  return (
    <CardContent className="p-6 flex flex-col h-full relative">
      <CardHeader className="p-0 flex flex-row items-center justify-between mb-4 space-y-0">
        <Heading level="widget" className="text-muted-foreground">
          {title}
        </Heading>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <div className="flex flex-col flex-1">
        <div>{formatValue(value)}</div>
        {trend && TrendIcon && (
          <p className={cn('text-xs mt-2 flex items-center gap-1', trendDirection ? trendColors[trendDirection] : 'text-muted-foreground')}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trend}
          </p>
        )}
      </div>
      {footer && (
        <div className="mt-auto pt-4 border-t">
          <div className="text-right">
            {footer}
          </div>
        </div>
      )}
    </CardContent>
  );
}


export function MetricCard({
  title,
  icon,
  value,
  trend,
  trendDirection,
  href,
  className,
  footer,
}: MetricCardProps) {
  const cardClasses = cn(
    'rounded-xl border-border bg-card text-card-foreground shadow-sm',
    href && 'hover:shadow-md transition-all',
    className
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className={cardClasses}>
          <MetricCardContent
            title={title}
            icon={icon}
            value={value}
            trend={trend}
            trendDirection={trendDirection}
            footer={footer}
          />
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cardClasses}>
      <MetricCardContent
        title={title}
        icon={icon}
        value={value}
        trend={trend}
        trendDirection={trendDirection}
        footer={footer}
      />
    </Card>
  );
}
