import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DataShellActionButton {
  /** Label do botão */
  label: string;
  /** Ícone customizado (default: Plus) */
  icon?: React.ReactNode;
  /** Callback ao clicar */
  onClick: () => void;
  /** Tooltip opcional (default: usa label) */
  tooltip?: string;
}

export interface DataShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content for the header slot (toolbar/filters) */
  header?: React.ReactNode;
  /** Content for the sub-header slot (summary cards/stats between header and content) */
  subHeader?: React.ReactNode;
  /** Content for the footer slot (pagination/summary) */
  footer?: React.ReactNode;
  /** Main content (table/list) */
  children: React.ReactNode;
  /** Accessible label for the data region */
  ariaLabel?: string;
  /** Botão de ação primária (renderizado fora da shell, canto superior direito) */
  actionButton?: DataShellActionButton;
  /** Se true, aplica overflow-auto ao conteúdo para rolagem local (útil em diálogos ou contêineres de altura fixa) */
  scrollableContent?: boolean;
}

/**
 * =============================================================================
 * DataShell - PADRÃO OBRIGATÓRIO para Visualização de Dados no Synthropic
 * =============================================================================
 *
 * IMPORTANTE: Este é o padrão oficial para todas as tabelas/listas de dados.
 * O DataTable DEVE ser usado dentro de um DataShell.
 *
 * ESTRUTURA:
 * ---------
 * Container visual para superfícies de dados (listas/tabelas) com narrativa colada:
 * - header (toolbar/filtros)
 * - conteúdo (área scrollável com DataTable)
 * - footer (paginação/summary)
 *
 * PADRÃO DE USO OBRIGATÓRIO:
 * -------------------------
 * ```tsx
 * <DataShell
 *   header={<DataTableToolbar table={table} />}
 *   footer={<DataPagination {...paginationProps} />}
 * >
 *   <DataTable
 *     columns={columns}
 *     data={data}
 *   />
 * </DataShell>
 * ```
 *
 * LAYOUT "FLAT":
 * -------------
 * O DataShell é um orquestrador de layout transparente (sem borda/shadow).
 * A tabela (DataTable) renderiza sua própria borda (rounded-md border bg-card).
 * Toolbar e paginação flutuam acima e abaixo da tabela.
 *
 * NUNCA use DataTable diretamente sem DataShell!
 *
 * ACESSIBILIDADE:
 * --------------
 * - role="region" com aria-label para identificar a seção
 * - data-slot para hooks de teste/CSS
 *
 * =============================================================================
 */
export function DataShell({
  header,
  subHeader,
  footer,
  children,
  className,
  ariaLabel = 'Seção de dados',
  // actionButton is now passed directly to DataTableToolbar, not via cloneElement
  actionButton: _actionButton,
  scrollableContent = false,
  ...props
}: DataShellProps) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      data-slot="data-shell"
      className={cn('w-full', className)}
      {...props}
    >
      {header && (
        <div data-slot="data-shell-header">
          {header}
        </div>
      )}

      {subHeader && (
        <div data-slot="data-shell-subheader" className="mb-4">
          {subHeader}
        </div>
      )}

      <div
        data-slot="data-shell-content"
        className={cn(
          'relative min-h-0 w-full',
          scrollableContent && 'overflow-auto'
        )}
      >
        {children}
      </div>

      {footer && (
        <div data-slot="data-shell-footer" className="mt-3 pb-4">
          {footer}
        </div>
      )}
    </div>
  );
}
