'use client';

import { useState, useMemo, useCallback } from 'react';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { ParteBadge } from '@/components/ui/parte-badge';
import { ComunicacaoDetalhesDialog } from './detalhes-dialog';
import { PdfViewerDialog } from './pdf-viewer-dialog';
import {
  Eye,
  FileText,
  ExternalLink,
  AlertCircle,
  Bell,
  Mail,
  ScrollText,
  Gavel,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComunicacaoItem } from '../../comunica-cnj/domain';
import { DataShell, DataTableToolbar, DataTable, DataTableColumnHeader, DataPagination } from '@/components/shared/data-shell';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';

/**
 * Configuração de tipos de comunicação (cores + ícones para acessibilidade).
 *
 * @ai-context Cores alinhadas com design system:
 * - red: intimação (crítico)
 * - orange: citação/notificação (warning)
 * - blue: lista de distribuição (info)
 * - purple: carta precatória (formal)
 * - cyan: aviso (info secundário)
 */
const TIPO_COMUNICACAO_CONFIG: Record<string, { color: string; icon: typeof AlertCircle }> = {
  Intimação: {
    color: 'bg-destructive text-destructive border-destructive dark:bg-destructive/30 dark:text-destructive',
    icon: AlertCircle
  },
  Citação: {
    color: 'bg-warning text-warning border-warning dark:bg-warning/30 dark:text-warning',
    icon: Mail
  },
  Notificação: {
    color: 'bg-warning text-warning border-warning dark:bg-warning/30 dark:text-warning',
    icon: Bell
  },
  'Lista de distribuição': {
    color: 'bg-info text-info border-info dark:bg-info/30 dark:text-info',
    icon: ScrollText
  },
  'Carta Precatória': {
    color: 'bg-primary text-primary border-primary dark:bg-primary/30 dark:text-primary',
    icon: Mail
  },
  Aviso: {
    color: 'bg-palette-9/15 text-palette-9 border-palette-9/30',
    icon: Bell
  },
};

const TIPO_DOCUMENTO_CONFIG: Record<string, { color: string; icon: typeof FileText }> = {
  Despacho: {
    color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300',
    icon: FileText
  },
  Sentença: {
    color: 'bg-info text-info border-info dark:bg-info/30 dark:text-info',
    icon: Gavel
  },
  Acórdão: {
    color: 'bg-success text-success border-success dark:bg-success/30 dark:text-success',
    icon: ScrollText
  },
  Decisão: {
    color: 'bg-info text-info border-info dark:bg-info/30 dark:text-info',
    icon: Gavel
  },
  Certidão: {
    color: 'bg-palette-8/15 text-palette-8 border-palette-8/30',
    icon: FileText
  },
};

const getTipoComunicacaoConfig = (tipo: string) => {
  return TIPO_COMUNICACAO_CONFIG[tipo] || {
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: FileText
  };
};

const getTipoDocumentoConfig = (tipo: string) => {
  return TIPO_DOCUMENTO_CONFIG[tipo] || {
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: FileText
  };
};

interface ResultActionButtonsProps {
  comunicacao: ComunicacaoItem;
  onViewDetails: (c: ComunicacaoItem) => void;
  onViewPdf: (hash: string) => void;
}

function ResultActionButtons({ comunicacao, onViewDetails, onViewPdf }: ResultActionButtonsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewDetails(comunicacao)}
              aria-label="Ver detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver detalhes</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewPdf(comunicacao.hash)}
              aria-label="Ver certidão PDF"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver certidão PDF</TooltipContent>
        </Tooltip>

        {comunicacao.link && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir em nova aba" className="h-8 w-8" asChild>
                <a
                  href={comunicacao.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir no PJE"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir no PJE</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

interface ComunicaCNJResultsTableProps {
  comunicacoes: ComunicacaoItem[];
  isLoading: boolean;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (pageIndex: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
}

/**
 * Tabela de resultados da consulta ao Diário Oficial (CNJ)
 * Utiliza DataShell + DataTable para consistência com o design system
 */
export function ComunicaCNJResultsTable({
  comunicacoes,
  isLoading,
  pagination,
}: ComunicaCNJResultsTableProps) {
  const [selectedComunicacao, setSelectedComunicacao] = useState<ComunicacaoItem | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfHash, setSelectedPdfHash] = useState<string | null>(null);
  const [table, setTable] = useState<TanstackTable<ComunicacaoItem> | undefined>();

  const handleViewDetails = useCallback((c: ComunicacaoItem) => {
    setSelectedComunicacao(c);
  }, []);

  const handleViewPdf = useCallback((hash: string) => {
    setSelectedPdfHash(hash);
    setPdfViewerOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<ComunicacaoItem>[]>(() => [
    {
      accessorKey: 'dataDisponibilizacao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => (
        <div className="text-xs">
          {row.original.dataDisponibilizacaoFormatada || '-'}
        </div>
      ),
      size: 100,
      meta: { align: 'left' },
      enableSorting: true,
    },
    {
      accessorKey: 'numeroProcesso',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Processo" />
      ),
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex flex-col gap-1.5 items-start py-2 max-w-[min(92vw,20rem)] min-w-0">
            {/* Tribunal */}
            <TribunalBadge codigo={c.siglaTribunal} className="text-xs" />

            {/* Número do processo */}
            <span className="text-xs font-mono font-medium text-foreground break-all" title={c.numeroProcessoComMascara}>
              {c.numeroProcessoComMascara}
            </span>

            {/* Partes */}
            <div className="flex flex-col gap-0.5">
              <ParteBadge
                polo="ATIVO"
                className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
              >
                {c.partesAutoras?.join(', ') || '-'}
              </ParteBadge>
              <ParteBadge
                polo="PASSIVO"
                className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
              >
                {c.partesReus?.join(', ') || '-'}
              </ParteBadge>
            </div>
          </div>
        );
      },
      size: 300,
      meta: { align: 'left' },
      enableSorting: true,
    },
    {
      accessorKey: 'tipoComunicacao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      cell: ({ row }) => {
        const tipo = row.original.tipoComunicacao;
        const config = getTipoComunicacaoConfig(tipo);
        const Icon = config.icon;
        return (
          <Badge className={cn('text-xs border flex items-center gap-1 w-fit', config.color)}>
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span>{tipo}</span>
          </Badge>
        );
      },
      size: 150,
      meta: { align: 'left' },
    },
    {
      accessorKey: 'tipoDocumento',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Documento" />
      ),
      cell: ({ row }) => {
        const tipo = row.original.tipoDocumento;
        const config = getTipoDocumentoConfig(tipo);
        const Icon = config.icon;
        return (
          <Badge className={cn('text-xs border flex items-center gap-1 w-fit', config.color)}>
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span>{tipo}</span>
          </Badge>
        );
      },
      size: 120,
      meta: { align: 'left' },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <ResultActionButtons
          comunicacao={row.original}
          onViewDetails={handleViewDetails}
          onViewPdf={handleViewPdf}
        />
      ),
      size: 100,
      meta: { align: 'left' },
    },
  ], [handleViewDetails, handleViewPdf]);

  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            table={table}
          />
        }
        footer={pagination && (
          <DataPagination
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
          />
        )}
        className="h-full"
      >
        <DataTable
          data={comunicacoes}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="Nenhuma comunicação encontrada"
          pagination={pagination}
          onTableReady={setTable}
        />
      </DataShell>

      <ComunicacaoDetalhesDialog
        comunicacao={selectedComunicacao}
        open={!!selectedComunicacao}
        onOpenChange={(open) => !open && setSelectedComunicacao(null)}
        onViewPdf={(hash) => {
          setSelectedPdfHash(hash);
          setPdfViewerOpen(true);
        }}
      />

      <PdfViewerDialog
        hash={selectedPdfHash}
        open={pdfViewerOpen}
        onOpenChange={(open) => {
          setPdfViewerOpen(open);
          if (!open) setSelectedPdfHash(null);
        }}
      />
    </>
  );
}
