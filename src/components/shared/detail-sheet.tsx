'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =============================================================================
// CONTEXT
// =============================================================================

interface DetailSheetContextValue {
  loading: boolean;
  error: string | null;
}

const DetailSheetContext = React.createContext<DetailSheetContextValue>({
  loading: false,
  error: null,
});

function useDetailSheet() {
  return React.useContext(DetailSheetContext);
}

// =============================================================================
// ROOT — DetailSheet
// =============================================================================

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Exibe skeleton de carregamento no lugar do conteúdo */
  loading?: boolean;
  /** Exibe estado de erro no lugar do conteúdo */
  error?: string | null;
  /** Largura customizada. Padrão: 'w-full sm:w-[540px] md:w-[620px]' */
  className?: string;
  side?: 'left' | 'right';
}

function DetailSheet({
  open,
  onOpenChange,
  children,
  loading = false,
  error = null,
  className,
  side = 'right',
}: DetailSheetProps) {
  const ctx = React.useMemo(
    () => ({ loading, error }),
    [loading, error]
  );

  return (
    <DetailSheetContext.Provider value={ctx}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={side}
          className={cn(
            'w-full sm:w-135 md:w-155 flex flex-col h-full bg-background',
            className
          )}
        >
          {loading ? (
            <DetailSheetSkeleton />
          ) : error ? (
            <DetailSheetError message={error} onClose={() => onOpenChange(false)} />
          ) : (
            children
          )}
        </SheetContent>
      </Sheet>
    </DetailSheetContext.Provider>
  );
}

// =============================================================================
// HEADER — DetailSheetHeader
// =============================================================================

interface DetailSheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetHeader({ children, className }: DetailSheetHeaderProps) {
  return (
    <SheetHeader className={cn('border-b pb-4', className)}>
      {children}
    </SheetHeader>
  );
}

// =============================================================================
// TITLE — DetailSheetTitle
// =============================================================================

interface DetailSheetTitleProps {
  children: React.ReactNode;
  className?: string;
  /** Badge de status exibido ao lado direito do título */
  badge?: React.ReactNode;
}

function DetailSheetTitle({ children, className, badge }: DetailSheetTitleProps) {
  if (badge) {
    return (
      <div className="flex items-start justify-between gap-4">
        <SheetTitle className={cn('text-xl font-heading font-bold truncate flex-1 min-w-0', className)}>
          {children}
        </SheetTitle>
        <div className="shrink-0">{badge}</div>
      </div>
    );
  }

  return (
    <SheetTitle className={cn('text-xl font-heading font-bold truncate', className)}>
      {children}
    </SheetTitle>
  );
}

// =============================================================================
// DESCRIPTION — DetailSheetDescription
// =============================================================================

interface DetailSheetDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetDescription({ children, className }: DetailSheetDescriptionProps) {
  return (
    <SheetDescription className={cn('flex items-center gap-2 mt-1 flex-wrap', className)}>
      {children}
    </SheetDescription>
  );
}

// =============================================================================
// ACTIONS — DetailSheetActions (botões do header)
// =============================================================================

interface DetailSheetActionsProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetActions({ children, className }: DetailSheetActionsProps) {
  return (
    <div className={cn('flex items-center gap-1 mt-2', className)}>
      {children}
    </div>
  );
}

// =============================================================================
// CONTENT — DetailSheetContent (área scrollável)
// =============================================================================

interface DetailSheetContentProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetContent({ children, className }: DetailSheetContentProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto p-4 space-y-4', className)}>
      {children}
    </div>
  );
}

// =============================================================================
// SECTION — Seção com ícone e título (card com borda)
// =============================================================================

interface DetailSheetSectionProps {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  /** Ação no canto superior direito da seção */
  action?: React.ReactNode;
  className?: string;
}

function DetailSheetSection({
  icon,
  title,
  children,
  action,
  className,
}: DetailSheetSectionProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </h4>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// =============================================================================
// INFO ROW — Par label:valor
// =============================================================================

interface DetailSheetInfoRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function DetailSheetInfoRow({ label, children, className }: DetailSheetInfoRowProps) {
  return (
    <div className={cn('flex items-start gap-2 text-sm', className)}>
      <span className="text-muted-foreground min-w-25 shrink-0">{label}:</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

// =============================================================================
// META GRID — Grid de metadados (status, prioridade, prazo, etc.)
// =============================================================================

interface DetailSheetMetaGridProps {
  children: React.ReactNode;
  /** Número de colunas. Padrão: 2 em mobile, 3 em sm+ */
  className?: string;
}

function DetailSheetMetaGrid({ children, className }: DetailSheetMetaGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4 sm:grid-cols-3', className)}>
      {children}
    </div>
  );
}

// =============================================================================
// META ITEM — Item dentro do MetaGrid
// =============================================================================

interface DetailSheetMetaItemProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function DetailSheetMetaItem({ label, children, className }: DetailSheetMetaItemProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2 text-sm font-medium">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// SEPARATOR — Separador semântico entre seções
// =============================================================================

interface DetailSheetSeparatorProps {
  className?: string;
}

function DetailSheetSeparator({ className }: DetailSheetSeparatorProps) {
  return <Separator className={cn('my-2', className)} />;
}

// =============================================================================
// AUDIT — Timestamps de criação/atualização
// =============================================================================

interface DetailSheetAuditProps {
  createdAt: string;
  updatedAt?: string;
  className?: string;
}

function DetailSheetAudit({ createdAt, updatedAt, className }: DetailSheetAuditProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = typeof dateStr === 'string' && dateStr.includes('T')
        ? parseISO(dateStr)
        : new Date(dateStr);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={cn('text-xs text-muted-foreground space-y-1 pt-2', className)}>
      <p>Criado em: {formatDate(createdAt)}</p>
      {updatedAt && <p>Atualizado em: {formatDate(updatedAt)}</p>}
    </div>
  );
}

// =============================================================================
// FOOTER — Ações do rodapé
// =============================================================================

interface DetailSheetFooterProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetFooter({ children, className }: DetailSheetFooterProps) {
  return (
    <SheetFooter className={cn('border-t pt-4', className)}>
      {children}
    </SheetFooter>
  );
}

// =============================================================================
// SKELETON — Estado de carregamento
// =============================================================================

function DetailSheetSkeleton() {
  return (
    <>
      <SheetHeader className="border-b pb-4">
        <SheetTitle className="sr-only">Carregando</SheetTitle>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </SheetHeader>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </>
  );
}

// =============================================================================
// ERROR — Estado de erro
// =============================================================================

interface DetailSheetErrorProps {
  message: string;
  onClose: () => void;
}

function DetailSheetError({ message, onClose }: DetailSheetErrorProps) {
  return (
    <>
      <SheetHeader className="border-b pb-4">
        <SheetTitle className="sr-only">Erro</SheetTitle>
      </SheetHeader>
      <div className="flex-1 flex items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertTriangle className="text-destructive" />
            </EmptyMedia>
            <EmptyTitle>Erro ao carregar</EmptyTitle>
            <EmptyDescription>{message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
      <SheetFooter className="border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </SheetFooter>
    </>
  );
}

// =============================================================================
// EMPTY — Estado vazio
// =============================================================================

interface DetailSheetEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

function DetailSheetEmpty({
  title = 'Não encontrado',
  description = 'Os detalhes não puderam ser carregados.',
  icon,
}: DetailSheetEmptyProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {icon || <AlertTriangle />}
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetDescription,
  DetailSheetActions,
  DetailSheetContent,
  DetailSheetSection,
  DetailSheetInfoRow,
  DetailSheetMetaGrid,
  DetailSheetMetaItem,
  DetailSheetSeparator,
  DetailSheetAudit,
  DetailSheetFooter,
  DetailSheetEmpty,
  useDetailSheet,
};

export type {
  DetailSheetProps,
  DetailSheetHeaderProps,
  DetailSheetTitleProps,
  DetailSheetDescriptionProps,
  DetailSheetActionsProps,
  DetailSheetContentProps,
  DetailSheetSectionProps,
  DetailSheetInfoRowProps,
  DetailSheetMetaGridProps,
  DetailSheetMetaItemProps,
  DetailSheetSeparatorProps,
  DetailSheetAuditProps,
  DetailSheetFooterProps,
  DetailSheetEmptyProps,
};
