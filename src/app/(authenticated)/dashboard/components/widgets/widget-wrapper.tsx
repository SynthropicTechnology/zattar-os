'use client';

import { LucideIcon, GripVertical, MoreHorizontal, X, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface WidgetWrapperProps {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  onRemove?: () => void;
  onSettings?: () => void;
  draggable?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function WidgetWrapper({
  title,
  icon: Icon,
  actions,
  loading,
  error,
  className,
  headerClassName,
  contentClassName,
  children,
  onRemove,
  onSettings,
  draggable = false,
  dragHandleProps,
}: WidgetWrapperProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-widget-title flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              {title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('group relative glass-widget bg-transparent transition-all duration-200', className)}>
      <CardHeader className={cn('pb-2', headerClassName)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-widget-title flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {actions}
            {(onSettings || onRemove) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onSettings && (
                    <DropdownMenuItem onClick={onSettings}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações
                    </DropdownMenuItem>
                  )}
                  {onRemove && (
                    <DropdownMenuItem onClick={onRemove} className="text-destructive">
                      <X className="h-4 w-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {draggable && (
              <div
                {...dragHandleProps}
                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

// Empty state para widgets
interface WidgetEmptyProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function WidgetEmpty({ icon: Icon, title, description, action }: WidgetEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {Icon && (
        <div className="rounded-full bg-muted p-3 mb-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <p className="text-widget-title">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
